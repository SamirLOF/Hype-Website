import { useState } from "react";
import { Unlock, AlertTriangle, Eye, EyeOff, ShieldCheck, Clock } from "lucide-react";

interface SiteGateProps {
  onVerify: (password: string, rememberMe: boolean) => Promise<boolean>;
  sessionExpired?: boolean;
}

export function SiteGate({ onVerify, sessionExpired = false }: SiteGateProps) {
  const [password, setPassword]     = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(false);
    const ok = await onVerify(password, rememberMe);
    setLoading(false);
    if (!ok) { setError(true); setPassword(""); }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden">
      <div className="scanline-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 space-y-3">

        {sessionExpired && (
          <div className="border border-destructive/60 bg-destructive/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-destructive to-transparent" />
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-destructive shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-display uppercase tracking-widest text-destructive text-sm font-bold">
                  Session Expired
                </p>
                <p className="font-mono text-xs text-destructive/80 mt-1 leading-relaxed">
                  Your OTP access has expired. Contact the owner to get a new access code.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="neon-border-primary bg-card/90 backdrop-blur-md p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-none" />
              <svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
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
            <h1 className="text-3xl font-display font-bold neon-text-primary uppercase tracking-[0.25em] text-center">
              LOF TOOLS
            </h1>
            <p className="text-xs font-mono text-primary/60 tracking-[0.3em] mt-1 uppercase">Free Fire</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border px-3 py-1">
              <ShieldCheck className="w-3 h-3 text-secondary" />
              SECURE AUTHENTICATION REQUIRED
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Enter password or OTP..."
                  autoFocus
                  className={`w-full bg-background/60 border pl-4 pr-10 py-3 font-mono text-sm tracking-widest focus:outline-none transition-all ${
                    error
                      ? "border-destructive focus:shadow-[0_0_8px_hsl(var(--destructive)_/_0.4)]"
                      : "border-border focus:border-primary focus:shadow-[0_0_8px_hsl(var(--primary)_/_0.3)]"
                  }`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs font-mono pt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  ACCESS DENIED — INVALID CREDENTIALS
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div onClick={() => setRememberMe(v => !v)}
                className={`w-4 h-4 border flex items-center justify-center transition-colors cursor-pointer ${
                  rememberMe ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                }`}>
                {rememberMe && <div className="w-2 h-2 bg-primary-foreground" />}
              </div>
              <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">
                Remember Me (24 hours)
              </span>
            </label>

            <button type="submit" disabled={loading || !password.trim()}
              className="w-full bg-primary text-primary-foreground font-display uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {loading
                ? <span className="animate-pulse font-mono text-sm">VERIFYING...</span>
                : <><Unlock className="w-4 h-4" />Authenticate</>}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] text-muted-foreground/40 mt-2 tracking-widest uppercase">
          V 1.01 // @LEAKS OF FF // RESTRICTED ACCESS
        </p>
      </div>
    </div>
  );
}
