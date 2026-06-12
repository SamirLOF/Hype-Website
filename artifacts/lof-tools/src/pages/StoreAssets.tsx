import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, AlertCircle, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const REGIONS = ["SG", "BD", "IND", "CIS", "EU", "NA", "PK", "ID", "TH", "MEA", "BR", "LATAM", "VN", "TW"];

const SHARED_STORE = ["252x256", "1500x750", "512x182"];
const REGION_FILTERS: Record<string, string[]> = {
  IND:   SHARED_STORE,
  SG:    SHARED_STORE,
  BD:    SHARED_STORE,
  EU:    SHARED_STORE,
  CIS:   SHARED_STORE,
  PK:    SHARED_STORE,
  NA:    SHARED_STORE,
  LATAM: SHARED_STORE,
  BR:    ["TabUS"],
  ID:    ["bgmall", "mallsmall", "titlemall"],
  MEA:   ["BG", "TT", "SM"],
  TH:    ["LeftBG", "LeftTitle", "LeftMall"],
  TW:    ["252x256", "512x182"],
};

function extractUrls(obj: unknown): Array<{ name: string; url: string }> {
  const results: Array<{ name: string; url: string }> = [];

  function crawl(node: unknown, parentKey?: string) {
    if (typeof node === "string") {
      if (node.startsWith("https://") && /\.(png|jpg|jpeg|webp|gif|svg)/i.test(node)) {
        const filename = node.split("/").pop()?.replace(/\.[^.]+$/, "") || parentKey || "ASSET";
        results.push({ name: filename, url: node });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => crawl(item, parentKey ?? String(i)));
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        crawl(val, key);
      }
    }
  }

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const top = obj as Record<string, unknown>;
    for (const [key, val] of Object.entries(top)) {
      if (typeof val === "string" && val.startsWith("http")) {
        results.push({ name: key, url: val });
      } else {
        crawl(val, key);
      }
    }
  } else {
    crawl(obj);
  }

  return results;
}

export function StoreAssets() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["store-assets", region],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/store-assets?region=${region}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      return res.json();
    },
    retry: 1,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "URL Copied!",
      description: "Store asset URL copied to clipboard.",
      className: "neon-border-primary bg-card",
    });
  };

  const handleRegionChange = (r: string) => {
    setRegion(r);
    setActiveFilter("All");
    setSearch("");
  };

  const assets = useMemo(() => {
    if (!data) return [];
    let all = extractUrls(data);
    if (activeFilter !== "All") {
      all = all.filter(
        (a) =>
          a.name.toLowerCase().includes(activeFilter.toLowerCase()) ||
          a.url.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(
        (a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q)
      );
    }
    return all;
  }, [data, activeFilter, search]);

  const currentFilters = ["All", ...(REGION_FILTERS[region] || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display text-primary uppercase tracking-widest neon-text-primary">Store Region</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => handleRegionChange(r)}
              className={`px-4 py-2 font-mono text-sm uppercase transition-all duration-200 border ${
                region === r
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)_/_0.3)]"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by asset name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_8px_hsl(var(--primary)_/_0.3)] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {currentFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 font-mono text-xs uppercase rounded-none border transition-colors ${
                activeFilter === filter
                  ? "bg-primary/20 text-primary border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <p className="font-mono text-xs text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? "s" : ""} shown
          {search ? ` matching "${search}"` : ""}
        </p>
      )}

      {isError && (
        <div className="p-6 neon-border-primary bg-destructive/10 text-destructive flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display uppercase text-lg mb-1">System Error</h3>
            <p className="font-mono text-sm">Failed to establish secure connection to store database.</p>
            <p className="font-mono text-xs opacity-70 mt-2">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="neon-border-primary bg-card overflow-hidden">
              <Skeleton className="w-full h-48 bg-muted" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-full bg-muted" />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-9 w-full bg-muted" />
                  <Skeleton className="h-9 w-12 bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset, idx) => (
            <div
              key={idx}
              className="group neon-border-primary bg-card overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-[#050505] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain relative z-0"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.1"; }}
                />
              </div>

              <div className="p-4 flex flex-col flex-grow border-t border-border group-hover:border-primary/30 transition-colors bg-card/80">
                <h3 className="font-display font-bold text-sm mb-4 text-foreground break-words uppercase tracking-wide">
                  {asset.name}
                </h3>

                <div className="flex gap-2 mt-auto">
                  <Button
                    onClick={() => copyToClipboard(asset.url)}
                    variant="outline"
                    className="flex-grow font-mono uppercase tracking-widest border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="icon"
                    className="shrink-0 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {assets.length === 0 && !isError && !isLoading && (
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
