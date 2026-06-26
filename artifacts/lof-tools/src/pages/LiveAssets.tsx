import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, AlertCircle, Filter, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

const REGIONS = ["SG", "BD", "IND", "CIS", "EU", "NA", "PK", "ID", "TH", "MEA", "BR", "LATAM", "VN", "TW"];

const SHARED_256 = ["256x107"];
const REGION_FILTERS: Record<string, string[]> = {
  SG:    ["Tab", "1400x700", ...SHARED_256],
  IND:   ["Tab", "1400x700", ...SHARED_256],
  BD:    ["Tab", "1400x700", ...SHARED_256],
  CIS:   ["Tab", "1400x700", ...SHARED_256],
  EU:    ["Tab", "1400x700", ...SHARED_256],
  NA:    ["Tab", "1400x700", ...SHARED_256],
  PK:    ["Tab", "1400x700", ...SHARED_256],
  ID:    ["Tab", "1400x700", "Overview", ...SHARED_256],
  VN:    ["Tab", "1400x700"],
  LATAM: ["Tab", "1400x700", ...SHARED_256],
  BR:    ["Tab", "1400x700", ...SHARED_256],
  MEA:   ["Tab", "1400x700", "BG", ...SHARED_256],
  TW:    ["180x80", "1400x700", ...SHARED_256],
  TH:    ["TabTH", "1400x700", ...SHARED_256],
};

function extractImageUrls(obj: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  function crawl(v: unknown) {
    if (typeof v === "string") {
      if (
        v.startsWith("http") &&
        /\.(png|jpg|jpeg|webp|gif|svg)/i.test(v) &&
        !seen.has(v)
      ) {
        seen.add(v);
        urls.push(v);
      }
      return;
    }
    if (Array.isArray(v)) { v.forEach(crawl); return; }
    if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(crawl);
  }
  crawl(obj);
  return urls;
}

function getFilename(url: string): string {
  try { return decodeURIComponent(new URL(url).pathname.split("/").pop() || url); }
  catch { return url.split("/").pop() || url; }
}

export function LiveAssets() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 280);
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["live-assets", region],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/live-assets?region=${region}`);
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.detail || json?.error || `Server error ${res.status}`);
      return json;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL Copied!", description: "Asset URL copied to clipboard.", className: "neon-border-accent bg-card" });
  };

  const handleRegionChange = (r: string) => {
    setRegion(r);
    setActiveFilter("All");
    setSearchRaw("");
  };

  const allUrls = useMemo(() => data ? extractImageUrls(data) : [], [data]);

  const assets = useMemo(() => {
    let urls = allUrls;
    if (activeFilter !== "All") {
      urls = urls.filter((u) => u.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      urls = urls.filter((u) =>
        getFilename(u).toLowerCase().includes(q) ||
        u.toLowerCase().includes(q)
      );
    }
    return urls;
  }, [allUrls, activeFilter, search]);

  const currentFilters = ["All", ...(REGION_FILTERS[region] || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display text-secondary uppercase tracking-widest neon-text-accent">Region Select</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => handleRegionChange(r)}
              className={`px-4 py-2 font-mono text-sm uppercase transition-all duration-200 border ${
                region === r
                  ? "bg-secondary text-secondary-foreground border-secondary shadow-[0_0_10px_hsl(var(--secondary)_/_0.3)]"
                  : "bg-card text-muted-foreground border-border hover:border-secondary/50 hover:text-foreground"
              }`}
            >{r}</button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search by filename or URL..."
            value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary focus:shadow-[0_0_8px_hsl(var(--secondary)_/_0.3)] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {currentFilters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 font-mono text-xs uppercase rounded-none border transition-colors ${
                activeFilter === f ? "bg-secondary/20 text-secondary border-secondary" : "bg-transparent text-muted-foreground border-border hover:border-secondary/50"
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {data && (
        <p className="font-mono text-xs text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? "s" : ""} shown
          {search ? ` matching "${search}"` : ""}
          {" "}&mdash; {allUrls.length} total in region
        </p>
      )}

      {isError && (
        <div className="p-6 neon-border-primary bg-destructive/10 text-destructive flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-display uppercase text-lg mb-1">System Error</h3>
            <p className="font-mono text-sm">Failed to establish secure connection to asset server.</p>
            <p className="font-mono text-xs opacity-70 mt-2">{(error as Error)?.message}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}
              className="mt-4 font-mono uppercase border-destructive/50 text-destructive hover:bg-destructive/10">
              <RefreshCw className="w-3 h-3 mr-2" />Retry
            </Button>
          </div>
        </div>
      )}

      {(isLoading || isFetching) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="neon-border-accent bg-card overflow-hidden">
              <Skeleton className="w-full h-32 bg-muted" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-full bg-muted" /><Skeleton className="h-9 w-12 bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((url, idx) => (
            <div key={idx} className="group neon-border-accent bg-card overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-40 overflow-hidden bg-[#0a0a0c] flex items-center justify-center p-3">
                <img src={url} alt="Asset Preview" className="max-w-full max-h-full object-contain" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
              </div>
              <div className="p-4 flex flex-col flex-grow border-t border-border group-hover:border-secondary/30 transition-colors">
                <div className="mb-4 font-mono text-xs text-muted-foreground break-all" title={url}>
                  <span className="text-secondary/70 mr-2">FILE:</span>{getFilename(url)}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button onClick={() => copyToClipboard(url)} variant="outline"
                    className="flex-grow font-mono uppercase tracking-widest border-secondary/50 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors">
                    <Copy className="w-4 h-4 mr-2" />Copy URL
                  </Button>
                  <Button variant="outline" size="icon"
                    className="shrink-0 border-secondary/50 text-secondary hover:bg-secondary hover:text-secondary-foreground" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer" download><Download className="w-4 h-4" /></a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && !isError && (
            <div className="col-span-full py-16 text-center flex flex-col items-center justify-center gap-4 neon-border-accent bg-card/30">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground font-mono uppercase">
                {search ? `No assets matching "${search}"` : "No assets match the current filters."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
