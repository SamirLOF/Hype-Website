import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Settings, LogOut, Clock } from "lucide-react";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";

import { useSiteAuth } from "@/hooks/use-site-auth";
import { SiteGate } from "@/components/auth/SiteGate";
import { SplashBanners } from "@/pages/SplashBanners";
import { LiveAssets } from "@/pages/LiveAssets";
import { StoreAssets } from "@/pages/StoreAssets";
import { Playlists } from "@/pages/Playlists";
import { AdminPage } from "@/pages/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} second${s !== 1 ? "s" : ""}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m !== 1 ? "s" : ""}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h !== 1 ? "s" : ""} ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? "s" : ""} ${h % 24}h`;
}

type Tab = "splash" | "live" | "store" | "playlists";

function AppLayout({
  onLogout,
  otpExpiry,
}: {
  onLogout: () => void;
  otpExpiry: number | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("splash");
  const [showAdmin, setShowAdmin] = useState(false);
  const [timeLeft, setTimeLeft]   = useState<string | null>(null);

  useEffect(() => {
    if (!otpExpiry) { setTimeLeft(null); return; }
    const update = () => {
      const diff = otpExpiry - Date.now();
      setTimeLeft(diff > 0 ? formatDuration(diff) : null);
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [otpExpiry]);

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground relative overflow-hidden flex flex-col">
      <div className="scanline-overlay pointer-events-none" />

      {otpExpiry && timeLeft && (
        <div className="bg-secondary/10 border-b border-secondary/30 py-2 px-4 relative z-50">
          <div className="container mx-auto flex items-center gap-3">
            <Clock className="w-3 h-3 text-secondary shrink-0 animate-pulse" />
            <p className="font-mono text-xs text-secondary tracking-wide">
              OTP SESSION &mdash; Access available for:{" "}
              <span className="font-bold">{timeLeft}</span>
              {" "}(expires {new Date(otpExpiry).toLocaleString()})
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary))" strokeWidth="1.5"/>
                  <polygon points="20,7 33,13.5 33,26.5 20,33 7,26.5 7,13.5" fill="hsl(var(--primary)/0.08)" stroke="hsl(var(--primary)/0.4)" strokeWidth="0.8"/>
                  <path d="M14 20 L20 13 L26 20 L20 27 Z" fill="hsl(var(--primary))" opacity="0.9"/>
                  <path d="M20 13 L20 27" stroke="hsl(var(--primary-foreground))" strokeWidth="1" opacity="0.4"/>
                  <path d="M14 20 L26 20" stroke="hsl(var(--primary-foreground))" strokeWidth="1" opacity="0.4"/>
                  <circle cx="20" cy="20" r="2" fill="hsl(var(--primary-foreground))"/>
                  <circle cx="20" cy="2" r="1.5" fill="hsl(var(--primary))"/>
                  <circle cx="38" cy="11" r="1.5" fill="hsl(var(--primary))"/>
                  <circle cx="38" cy="29" r="1.5" fill="hsl(var(--primary))"/>
                  <circle cx="20" cy="38" r="1.5" fill="hsl(var(--primary))"/>
                  <circle cx="2" cy="29" r="1.5" fill="hsl(var(--primary))"/>
                  <circle cx="2" cy="11" r="1.5" fill="hsl(var(--primary))"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold uppercase tracking-[0.2em] neon-text-primary m-0 leading-none">
                  LOF TOOLS
                </h1>
                <p className="text-[10px] font-mono text-primary/70 tracking-widest mt-1">FREE FIRE</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {(["splash", "live", "store", "playlists"] as Tab[]).map((tab) => {
                const labels: Record<Tab, string> = {
                  splash:    "Splash Banners",
                  live:      "Live Assets",
                  store:     "Store Assets",
                  playlists: "FF Playlists",
                };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 font-display uppercase tracking-widest text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                      activeTab === tab
                        ? "text-primary bg-primary/10 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent"
                    }`}>
                    {labels[tab]}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <button onClick={() => setShowAdmin(true)} title="Admin Panel"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={onLogout} title="Logout"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
          {activeTab === "splash"    && <SplashBanners />}
          {activeTab === "live"      && <LiveAssets />}
          {activeTab === "store"     && <StoreAssets />}
          {activeTab === "playlists" && <Playlists />}
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 py-4 mt-auto relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-muted-foreground">
          <p>SYSTEM ONLINE. SECURE CONNECTION ESTABLISHED.</p>
          <p className="opacity-50">V 1.01 // @LEAKS OF FF // RESTRICTED ACCESS</p>
        </div>
      </footer>
    </div>
  );
}

function AuthenticatedApp() {
  const { authenticated, loading, verify, logout, sessionExpired, otpExpiry } = useSiteAuth();
  const { toast } = useToast();
  const prevOtpExpiry = useRef<number | null>(null);

  useEffect(() => {
    if (otpExpiry && otpExpiry !== prevOtpExpiry.current) {
      prevOtpExpiry.current = otpExpiry;
      const diff = otpExpiry - Date.now();
      toast({
        title: "OTP Access Granted",
        description: `Session active for ${formatDuration(diff)}. Expires: ${new Date(otpExpiry).toLocaleString()}`,
        duration: 9000,
        className: "bg-card border-secondary neon-border-accent font-mono",
      });
    }
  }, [otpExpiry, toast]);

  useEffect(() => {
    if (!authenticated || !otpExpiry) return;
    const check = () => {
      if (Date.now() >= otpExpiry) logout(true);
    };
    check();
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, [authenticated, otpExpiry, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-primary animate-pulse tracking-widest uppercase">Initializing...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <SiteGate onVerify={verify} sessionExpired={sessionExpired} />;
  }

  return (
    <Switch>
      <Route path="/">
        <AppLayout onLogout={logout} otpExpiry={otpExpiry} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthenticatedApp />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
