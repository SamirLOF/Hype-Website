import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, AlertCircle, Filter, Search, RefreshCw, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

const REGIONS = ["SG", "BD", "IND", "CIS", "EU", "NA", "PK", "ID", "TH", "MEA", "BR", "LATAM", "VN", "TW"];

const SHARED_STORE = ["252x256", "1500x750", "512x182"];
const REGION_FILTERS: Record<string, string[]> = {
  IND: SHARED_STORE, SG: SHARED_STORE, BD: SHARED_STORE, EU: SHARED_STORE,
  CIS: SHARED_STORE, PK: SHARED_STORE, NA: SHARED_STORE, LATAM: SHARED_STORE,
  VN: SHARED_STORE,
  BR:   ["TabUS"],
  ID:   ["bgmall", "mallsmall", "titlemall"],
  MEA:  ["BG", "TT", "SM"],
  TH:   ["LeftBG", "LeftTitle", "LeftMall"],
  TW:   ["252x256", "512x182"],
};

const IMAGE_EXT = /\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i;

function isFFCDN(url: string) {
  return (
    url.startsWith("https://dl.dir.freefiremobile.com/common") ||
    url.startsWith("https://dl.cdn.freefiremobile.com/common") ||
    url.startsWith("https://dl-tata.freefireind.in/common")
  );
}

function extractAssetUrls(obj: unknown): Array<{ name: string; url: string }> {
  const results: Array<{ name: string; url: string }> = [];
  const seen = new Set<string>();
  function crawl(v: unknown, key?: string) {
    if (typeof v === "string") {
      if (
        isFFCDN(v) &&
        !v.endsWith(".html") &&
        !v.includes("/common/test/167") &&
        !v.includes("/common/test/PreviewBG") &&
        !seen.has(v)
      ) {
        seen.add(v);
        const raw = v.split("/").pop() || key || "ASSET";
        const name = decodeURIComponent(raw);
        results.push({ name, url: v });
      }
      return;
    }
    if (Array.isArray(v)) { v.forEach((item, i) => crawl(item, key ?? String(i))); return; }
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) crawl(val, k);
    }
  }
  crawl(obj);
  return results;
}

function getExt(url: string): string {
  const m = url.match(/\.([a-z0-9_]+)(\?|$)/i);
  return m ? m[1].toLowerCase() : "";
}

export function StoreAssets() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 280);
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["store-assets", region],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/store-assets?region=${region}`);
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.detail || json?.error || `Server error ${res.status}`);
      return json;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL Copied!", description: "Store asset URL copied to clipboard.", className: "neon-border-primary bg-card" });
  };

  const handleRegionChange = (r: string) => {
    setRegion(r);
    setActiveFilter("All");
    setSearchRaw("");
  };

  const allAssets = useMemo(() => data ? extractAssetUrls(data) : [], [data]);

  const assets = useMemo(() => {
    let list = allAssets;
    if (activeFilter !== "All") {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(activeFilter.toLowerCase()) ||
        a.url.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAssets, activeFilter, search]);

  const currentFilters = ["All", ...(REGION_FILTERS[region] || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display text-primary uppercase tracking-widest neon-text-primary">Store Region</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => handleRegionChange(r)}
              className={`px-4 py-2 font-mono text-sm uppercase transition-all duration-200 border ${
                region === r
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)_/_0.3)]"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >{r}</button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search by filename or URL..."
            value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_8px_hsl(var(--primary)_/_0.3)] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {currentFilters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 font-mono text-xs uppercase rounded-none border transition-colors ${
                activeFilter === f ? "bg-primary/20 text-primary border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {data && (
        <p className="font-mono text-xs text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? "s" : ""} shown
          {search ? ` matching "${search}"` : ""}
          {" "}&mdash; {allAssets.length} total in region
        </p>
      )}

      {isError && (
        <div className="p-6 neon-border-primary bg-destructive/10 text-destructive flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-display uppercase text-lg mb-1">System Error</h3>
            <p className="font-mono text-sm">Failed to establish secure connection to store server.</p>
            <p className="font-mono text-xs opacity-70 mt-2">{(error as Error)?.message}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}
              className="mt-4 font-mono uppercase border-destructive/50 text-destructive hover:bg-destructive/10">
              <RefreshCw className="w-3 h-3 mr-2" />Retry
            </Button>
          </div>
        </div>
      )}

      {(isLoading || isFetching) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="neon-border-primary bg-card overflow-hidden">
              <Skeleton className="w-full h-48 bg-muted" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-full bg-muted" />
                <div className="flex gap-2 pt-4"><Skeleton className="h-9 w-full bg-muted" /><Skeleton className="h-9 w-12 bg-muted" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset, idx) => {
            const isImage = IMAGE_EXT.test(asset.url);
            const ext = getExt(asset.url);
            return (
              <div key={idx} className="group neon-border-primary bg-card overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
                <div className="relative aspect-square overflow-hidden bg-[#050505] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                  {isImage ? (
                    <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain relative z-0" loading="lazy"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = "none";
                      }} />
                  ) : (
                    <div className="relative z-0 flex flex-col items-center gap-2 text-primary/50">
                      <FileCode className="w-12 h-12" />
                      <span className="font-mono text-xs uppercase tracking-widest">.{ext || "asset"}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow border-t border-border group-hover:border-primary/30 transition-colors bg-card/80">
                  <h3 className="font-mono text-xs mb-4 text-muted-foreground break-words" title={asset.url}>
                    {asset.name}
                  </h3>
                  <div className="flex gap-2 mt-auto">
                    <Button onClick={() => copyToClipboard(asset.url)} variant="outline"
                      className="flex-grow font-mono uppercase tracking-widest border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Copy className="w-4 h-4 mr-2" />Copy URL
                    </Button>
                    <Button variant="outline" size="icon"
                      className="shrink-0 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" download><Download className="w-4 h-4" /></a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {assets.length === 0 && !isError && (
            <div className="col-span-full py-16 text-center flex flex-col items-center justify-center gap-4 neon-border-primary bg-card/30">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground font-mono uppercase">
                {search ? `No assets matching "${search}"` : "No store assets found."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
