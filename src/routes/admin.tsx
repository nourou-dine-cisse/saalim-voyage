import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LangProvider, useLang } from "@/i18n/LangContext";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Saalim Voyages" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <LangProvider>
      <AdminInner />
    </LangProvider>
  );
}

function AdminInner() {
  const { t } = useLang();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setIsAdmin(null);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setChecking(true);
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!error && !!data);
      setChecking(false);
    })();
  }, [session]);

  if (!session) return <Login />;
  if (checking) return <CenterMsg msg={t.common.loading} />;
  if (!isAdmin) return <CenterMsg msg={t.admin.forbidden} signOut />;
  return <Dashboard />;
}

function CenterMsg({ msg, signOut }: { msg: string; signOut?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <p className="text-foreground">{msg}</p>
        {signOut && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-primary underline"
          >
            ↩ Sign out
          </button>
        )}
      </div>
    </div>
  );
}

function Login() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (err) setError(t.admin.invalidCreds);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-gold/5 p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-elegant">
        <h1 className="font-display text-2xl font-semibold text-foreground">{t.admin.loginTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">{t.admin.loginSubtitle}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">{t.admin.email}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">{t.admin.password}</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-full font-semibold disabled:opacity-60"
          >
            {submitting ? t.admin.signingIn : t.admin.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}

type Tab = "metrics" | "registrations" | "visas" | "payments" | "reviews" | "contacts";

function Dashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("metrics");

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: t.admin.tabMetrics },
    { key: "registrations", label: t.admin.tabRegistrations },
    { key: "visas", label: t.admin.tabVisas },
    { key: "payments", label: t.admin.tabPayments },
    { key: "reviews", label: t.admin.tabReviews },
    { key: "contacts", label: t.admin.tabContacts },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-primary">{t.admin.dashboardTitle}</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t.admin.signOut}
          </button>
        </div>
        <div className="container mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === tb.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {tab === "metrics" && <Metrics />}
        {tab === "registrations" && <Registrations />}
        {tab === "visas" && <VisaRequests />}
        {tab === "payments" && <Payments />}
        {tab === "reviews" && <ReviewsModeration />}
        {tab === "contacts" && <Contacts />}
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className="font-display text-3xl font-semibold text-primary mt-1">{value}</div>
    </div>
  );
}

function Metrics() {
  const { t, lang } = useLang();
  const [regs, setRegs] = useState<{ payment_status: string; departure_date: string | null; created_at: string }[]>([]);
  const [visas, setVisas] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { count: v }] = await Promise.all([
        supabase.from("registrations").select("payment_status, departure_date, created_at"),
        supabase.from("visa_requests").select("*", { count: "exact", head: true }),
      ]);
      setRegs(r || []);
      setVisas(v || 0);
    })();
  }, []);

  const total = regs.length;
  const paid = regs.filter((r) => r.payment_status === "paid").length;
  const pending = regs.filter((r) => r.payment_status !== "paid").length;

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    regs.forEach((r) => {
      if (!r.departure_date) return;
      const d = new Date(r.departure_date);
      const key = d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long" });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [regs, lang]);

  const max = byMonth[0]?.[1] || 1;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title={t.admin.metricsTotal} value={total} />
        <Card title={t.admin.metricsPaid} value={paid} />
        <Card title={t.admin.metricsPending} value={pending} />
        <Card title={t.admin.metricsVisas} value={visas} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t.admin.metricsByMonth}</h3>
        {byMonth.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t.admin.noData}</p>
        ) : (
          <div className="space-y-3">
            {byMonth.map(([m, n]) => (
              <div key={m}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground capitalize">{m}</span>
                  <span className="font-semibold text-primary">{n}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Reg {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  service_type: string;
  departure_date: string | null;
  payment_status: string;
  status: string;
  passport_path: string | null;
  created_at: string;
}

function Registrations() {
  const { t } = useLang();
  const [rows, setRows] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      setRows((data as Reg[]) || []);
      setLoading(false);
    })();
  }, []);

  const viewPassport = async (path: string) => {
    const { data } = await supabase.storage.from("passports").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (rows.length === 0) return <p className="text-muted-foreground italic">{t.admin.noData}</p>;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Date</Th>
              <Th>Nom</Th>
              <Th>Contact</Th>
              <Th>Service</Th>
              <Th>Départ</Th>
              <Th>Paiement</Th>
              <Th>Passeport</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                <Td>{r.full_name}</Td>
                <Td>
                  <div>{r.email}</div>
                  <div className="text-xs text-muted-foreground">{r.phone}</div>
                </Td>
                <Td>{r.service_type}</Td>
                <Td>{r.departure_date || "—"}</Td>
                <Td>
                  <Badge ok={r.payment_status === "paid"}>{r.payment_status}</Badge>
                </Td>
                <Td>
                  {r.passport_path ? (
                    <button onClick={() => viewPassport(r.passport_path!)} className="text-primary underline text-xs">
                      {t.admin.viewPassport}
                    </button>
                  ) : (
                    "—"
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Visa {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  desired_departure_date: string;
  status: string;
  payment_status: string;
  passport_path: string | null;
  created_at: string;
}

function VisaRequests() {
  const { t } = useLang();
  const [rows, setRows] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("visa_requests").select("*").order("created_at", { ascending: false });
      setRows((data as Visa[]) || []);
      setLoading(false);
    })();
  }, []);
  const viewPassport = async (path: string) => {
    const { data } = await supabase.storage.from("passports").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (rows.length === 0) return <p className="text-muted-foreground italic">{t.admin.noData}</p>;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Date</Th>
              <Th>Nom</Th>
              <Th>Contact</Th>
              <Th>Départ</Th>
              <Th>Statut</Th>
              <Th>Passeport</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                <Td>{r.full_name}</Td>
                <Td>
                  <div>{r.email}</div>
                  <div className="text-xs text-muted-foreground">{r.whatsapp}</div>
                </Td>
                <Td>{r.desired_departure_date}</Td>
                <Td>
                  <Badge ok={r.status === "approved"}>{r.status}</Badge>
                </Td>
                <Td>
                  {r.passport_path ? (
                    <button onClick={() => viewPassport(r.passport_path!)} className="text-primary underline text-xs">
                      {t.admin.viewPassport}
                    </button>
                  ) : (
                    "—"
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Payment {
  id: string;
  payer_name: string;
  payer_phone: string;
  amount: number | null;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  installment_type: string;
  created_at: string;
}

function Payments() {
  const { t } = useLang();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      setRows((data as Payment[]) || []);
      setLoading(false);
    })();
  }, []);

  const confirm = async (id: string) => {
    await supabase.from("payments").update({ status: "confirmed" }).eq("id", id);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
  };

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (rows.length === 0) return <p className="text-muted-foreground italic">{t.admin.noData}</p>;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Date</Th>
              <Th>Payeur</Th>
              <Th>Montant</Th>
              <Th>Méthode</Th>
              <Th>Réf.</Th>
              <Th>Statut</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                <Td>
                  <div>{r.payer_name}</div>
                  <div className="text-xs text-muted-foreground">{r.payer_phone}</div>
                </Td>
                <Td>
                  {r.amount?.toLocaleString() || "—"} {r.currency}
                </Td>
                <Td className="capitalize">{r.method}</Td>
                <Td className="font-mono text-xs">{r.reference || "—"}</Td>
                <Td>
                  <Badge ok={r.status === "confirmed"}>{r.status}</Badge>
                </Td>
                <Td>
                  {r.status !== "confirmed" && (
                    <button
                      onClick={() => confirm(r.id)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full"
                    >
                      {t.admin.confirm}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Rev {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  service_type: string | null;
  travel_period: string | null;
  created_at: string;
}

function ReviewsModeration() {
  const { t } = useLang();
  const [rows, setRows] = useState<Rev[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      setRows((data as Rev[]) || []);
      setLoading(false);
    })();
  }, []);
  const approve = async (id: string) => {
    await supabase.from("reviews").update({ approved: true }).eq("id", id);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, approved: true } : r)));
  };
  const reject = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };
  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (rows.length === 0) return <p className="text-muted-foreground italic">{t.admin.noData}</p>;
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">{r.author_name}</span>
                <span className="text-gold text-sm">{"★".repeat(r.rating)}</span>
                <Badge ok={r.approved}>{r.approved ? "approved" : "pending"}</Badge>
              </div>
              <p className="text-sm text-foreground italic">"{r.comment}"</p>
              <div className="text-xs text-muted-foreground mt-2">
                {r.service_type} {r.travel_period && `· ${r.travel_period}`}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {!r.approved && (
                <button onClick={() => approve(r.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
                  {t.admin.approve}
                </button>
              )}
              <button onClick={() => reject(r.id)} className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">
                {t.admin.reject}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Msg {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  created_at: string;
}

function Contacts() {
  const { t } = useLang();
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      setRows((data as Msg[]) || []);
      setLoading(false);
    })();
  }, []);
  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (rows.length === 0) return <p className="text-muted-foreground italic">{t.admin.noData}</p>;
  return (
    <div className="space-y-3">
      {rows.map((m) => (
        <div key={m.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">{m.full_name}</span>
            <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            {m.email} {m.phone && `· ${m.phone}`}
          </div>
          {m.subject && <div className="text-sm font-medium text-primary mb-1">{m.subject}</div>}
          <p className="text-sm text-foreground whitespace-pre-wrap">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-foreground ${className}`}>{children}</td>;
}
function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {children}
    </span>
  );
}
