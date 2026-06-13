import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Key, Trash2, Copy, Plus, Clock, ArrowLeft,
  RefreshCw, CheckCircle, Lock, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VALIDITY_OPTIONS = [
  { value: "10min", label: "10 Minutes" },
  { value: "1hr",   label: "1 Hour"     },
  { value: "6hr",   label: "6 Hours"    },
  { value: "30d",   label: "30 Days"    },
  { value: "90d",   label: "90 Days"    },
  { value: "365d",  label: "365 Days"   },
];

const ADMIN_PW     = "1125";
const ADMIN_SS_KEY = "lof-admin-auth";

interface OtpEntry {
  id: string;
  code: string;
  expiresAt: string;
  validityLabel: string;
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function AdminPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PW) {
      sessionStorage.setItem(ADMIN_SS_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="scanline-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="neon-border-primary bg-card/90 backdrop-blur-md p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 border border-primary/40 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <ShieldCheck className="w-8 h-8 text-primary relative z-10" />
            </div>
            <h1 className="text-2xl font-display font-bold neon-text-primary uppercase tracking-[0.2em] text-center">
              Admin Panel
            </h1>
            <p className="text-xs font-mono text-muted-foreground tracking-widest mt-2">ELEVATED ACCESS REQUIRED</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Admin Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError(false); }}
                  placeholder="Enter admin password..."
                  autoFocus
                  className={`w-full bg-background/60 border pl-4 pr-10 py-3 font-mono text-sm tracking-widest focus:outline-none transition-all ${
                    error
                      ? "border-destructive focus:shadow-[0_0_8px_hsl(var(--destructive)_/_0.4)]"
                      : "border-border focus:border-primary focus:shadow-[0_0_8px_hsl(var(--primary)_/_0.3)]"
                  }`}
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs font-mono pt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  INVALID ADMIN CREDENTIALS
                </div>
              )}
            </div>
            <button type="submit" disabled={!pw.trim()}
              className="w-full bg-primary text-primary-foreground font-display uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Lock className="w-4 h-4" /> Enter Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_SS_KEY) === "1"
  );
  const [validity, setValidity]   = useState("1hr");
  const [newOtp, setNewOtp]       = useState<OtpEntry | null>(null);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  if (!unlocked) {
    return (
      <AdminPasswordGate
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  return <AdminPanelContent
    onBack={onBack}
    validity={validity}
    setValidity={setValidity}
    newOtp={newOtp}
    setNewOtp={setNewOtp}
    copiedId={copiedId}
    setCopiedId={setCopiedId}
    toast={toast}
    qc={qc}
  />;
}

function AdminPanelContent({
  onBack, validity, setValidity, newOtp, setNewOtp, copiedId, setCopiedId, toast, qc,
}: {
  onBack: () => void;
  validity: string; setValidity: (v: string) => void;
  newOtp: OtpEntry | null; setNewOtp: (o: OtpEntry | null) => void;
  copiedId: string | null; setCopiedId: (id: string | null) => void;
  toast: ReturnType<typeof useToast>["toast"];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-otps"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/otp/list?adminPassword=${ADMIN_PW}`);
      return r.json() as Promise<{ otps: OtpEntry[] }>;
    },
    refetchInterval: 30_000,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: ADMIN_PW, validity }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? `Server error ${r.status}`);
      if (!d.otp) throw new Error("No OTP returned from server");
      return d as { otp: OtpEntry };
    },
    onSuccess: (d) => {
      setNewOtp(d.otp);
      qc.invalidateQueries({ queryKey: ["admin-otps"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Generation Failed",
        description: err.message,
        className: "bg-card border-destructive text-destructive font-mono",
      });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/otp/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: ADMIN_PW }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? `Server error ${r.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-otps"] });
      toast({ title: "OTP Revoked", className: "bg-card neon-border-primary" });
    },
    onError: (err: Error) => {
      toast({
        title: "Revoke Failed",
        description: err.message,
        className: "bg-card border-destructive text-destructive font-mono",
      });
    },
  });

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: `Copied: ${code}`, className: "bg-card neon-border-primary" });
  };

  const otps: OtpEntry[] = data?.otps ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="scanline-overlay pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack}
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest border border-border hover:border-primary/50 px-3 py-2">
            <ArrowLeft className="w-3 h-3" />Back
          </button>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg uppercase tracking-widest neon-text-primary">Admin Panel</h1>
          </div>
          <div className="ml-auto font-mono text-xs text-muted-foreground border border-border px-3 py-1">
            LOF TOOLS COMMAND CENTER
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">

        <div className="neon-border-primary bg-card/60 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-display uppercase tracking-widest text-primary">Generate One-Time Password</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow space-y-1">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Validity Duration</label>
              <div className="flex flex-wrap gap-2">
                {VALIDITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setValidity(opt.value)}
                    className={`px-3 py-2 font-mono text-xs uppercase border transition-all ${
                      validity === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_8px_hsl(var(--primary)_/_0.3)]"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setNewOtp(null); generate.mutate(); }} disabled={generate.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-widest px-6 py-2 hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)_/_0.4)] transition-all disabled:opacity-50 whitespace-nowrap">
              <Plus className="w-4 h-4" />
              {generate.isPending ? "Generating..." : "Generate OTP"}
            </button>
          </div>

          {newOtp && (
            <div className="mt-6 neon-border-accent bg-secondary/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent" />
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span className="font-mono text-sm text-secondary uppercase tracking-widest">OTP Generated</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="font-display text-4xl tracking-[0.4em] neon-text-accent font-bold">{newOtp.code}</span>
                <button onClick={() => copyCode(newOtp.code, newOtp.id)}
                  className="flex items-center gap-2 border border-secondary/50 text-secondary px-4 py-2 font-mono text-xs uppercase hover:bg-secondary/10 transition-colors">
                  {copiedId === newOtp.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === newOtp.id ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Valid for {newOtp.validityLabel} &mdash; expires {new Date(newOtp.expiresAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="neon-border-primary bg-card/60 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display uppercase tracking-widest text-primary">Active OTPs</h2>
              <span className="font-mono text-xs text-muted-foreground border border-border px-2 py-0.5">{otps.length}</span>
            </div>
            <button onClick={() => refetch()}
              className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50 px-3 py-1">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/20 animate-pulse" />)}</div>
          ) : otps.length === 0 ? (
            <div className="py-12 text-center">
              <Key className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-mono text-sm text-muted-foreground uppercase">No active OTPs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {otps.map(otp => (
                <div key={otp.id}
                  className="flex items-center justify-between border border-border bg-background/40 px-4 py-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-xl tracking-[0.3em] neon-text-primary font-bold">{otp.code}</span>
                    <div className="hidden sm:block">
                      <p className="font-mono text-xs text-muted-foreground">{otp.validityLabel}</p>
                      <p className="font-mono text-xs text-secondary">{timeLeft(otp.expiresAt)} remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(otp.code, otp.id)}
                      className="border border-border text-muted-foreground hover:border-primary/50 hover:text-primary px-3 py-1 font-mono text-xs uppercase transition-colors flex items-center gap-1">
                      {copiedId === otp.id ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === otp.id ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => remove.mutate(otp.id)} disabled={remove.isPending}
                      className="border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-1 font-mono text-xs uppercase transition-colors flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="neon-border-primary bg-card/60 p-6">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-display uppercase tracking-widest text-primary">Site Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Site Password",  value: "2511 (master)" },
              { label: "Admin Password", value: "1125 (elevated)" },
              { label: "OTP Length",     value: "6 characters"   },
            ].map(({ label, value }) => (
              <div key={label} className="border border-border bg-background/40 p-4">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                <p className="font-display text-sm text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
