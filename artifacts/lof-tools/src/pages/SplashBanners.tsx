import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Clock, Calendar, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

const REGIONS = ["SG", "BD", "IND", "CIS", "EU", "NA", "PK", "ID", "TH", "ME", "BR", "LATAM", "VN", "TW"];

export function SplashBanners() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 280);
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["splash-banners", region],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/splash?region=${region}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      return res.json();
    },
    retry: 1,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL Copied!", description: "Image URL copied to clipboard.", className: "neon-border-primary bg-card" });
  };

  const allBanners: Array<{ Title: string; Start: string; End: string; Banner: string }> =
    Array.isArray(data?.events) ? data.events : [];

  const banners = useMemo(() => {
    if (!search.trim()) return allBanners;
    const q = search.trim().toLowerCase();
    return allBanners.filter((b) =>
      (b.Title ?? "").toLowerCase().includes(q) ||
      (b.Banner ?? "").toLowerCase().includes(q) ||
      (b.Banner ?? "").split("/").pop()?.toLowerCase().includes(q)
    );
  }, [allBanners, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display text-primary uppercase tracking-widest neon-text-primary">Region Select</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)}
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
          <input
            type="text" placeholder="Search by title, filename or URL..."
            value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_8px_hsl(var(--primary)_/_0.3)] transition-all"
          />
        </div>
      </div>

      {isError && (
        <div className="p-6 neon-border-accent bg-destructive/10 text-destructive flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display uppercase text-lg mb-1">Connection Error</h3>
            <p className="font-mono text-sm">Failed to fetch splash banners for region {region}.</p>
            <p className="font-mono text-xs opacity-70 mt-2">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="neon-border-primary bg-card overflow-hidden">
              <Skeleton className="w-full h-48 bg-muted" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
                <Skeleton className="h-10 w-full bg-muted mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!isError && (
            <p className="font-mono text-xs text-muted-foreground">
              {banners.length} of {allBanners.length} event{allBanners.length !== 1 ? "s" : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {banners.map((banner, idx) => (
              <div key={idx} className="group neon-border-primary bg-card overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]">
                <div className="relative aspect-video overflow-hidden bg-muted/20">
                  <img src={banner.Banner} alt={banner.Title || "Splash Banner"}
                    className="w-full h-full object-contain p-2" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-40" />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-display font-bold text-base mb-4 line-clamp-2" title={banner.Title}>
                    {banner.Title || "UNTITLED ASSET"}
                  </h3>
                  <div className="space-y-2 mb-4 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">Start: {banner.Start || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">End: {banner.End || "N/A"}</span>
                    </div>
                  </div>
                  <Button onClick={() => copyToClipboard(banner.Banner)} variant="outline"
                    className="w-full font-mono uppercase tracking-widest border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary">
                    <Copy className="w-4 h-4 mr-2" />Copy URL
                  </Button>
                </div>
              </div>
            ))}
            {banners.length === 0 && !isError && !isLoading && (
              <div className="col-span-full py-12 text-center text-muted-foreground font-mono neon-border-primary bg-card/50">
                {search ? `NO RESULTS FOR "${search.toUpperCase()}"` : "NO SPLASH BANNERS FOUND FOR THIS REGION."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
