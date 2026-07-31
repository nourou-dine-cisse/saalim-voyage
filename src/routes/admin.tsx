import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  clearToken,
  getToken,
  login as apiLogin,
  API_URL,
  requireToken,
  createDeparture,
  deleteDeparture,
  deleteVideo,
  fetchDepartures,
  fetchRegistrations,
  fetchVideos,
  addVideo,
  createPackage,
  deletePackage,
  fetchAllPackages,
  updatePackage,
  approveReview,
  confirmPayment,
  fetchAllReviews,
  fetchContactMessages,
  fetchPayments,
  fetchStats,
  removeReview,
  type AdminStats,
  type ContactMessage,
  type Departure,
  type Payment,
  type RegistrationIndexRow,
  type Review,
  type Package,
  type PackageForm,
  type Video,
} from "@/lib/api";
import { LangProvider, useLang } from "@/i18n/LangContext";

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
  // La session admin est gérée par l'API (un seul compte, jeton signé).
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setReady(true);
  }, []);

  const signOut = () => {
    clearToken();
    setTokenState(null);
  };

  if (!ready) return null;
  if (!token) return <Login onSuccess={() => setTokenState(getToken())} />;
  return <Dashboard onSignOut={signOut} />;
}

function CenterMsg({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <p className="text-foreground text-center">{msg}</p>
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiLogin(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.invalidCreds);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-gold/5 p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-elegant">
        <h1 className="font-display text-2xl font-semibold text-foreground">{t.admin.loginTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">{t.admin.loginSubtitle}</p>
        {import.meta.env.DEV && (
          <p className="text-[11px] text-muted-foreground mb-4 font-mono break-all">API : {API_URL}</p>
        )}
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
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">
              {error}
            </div>
          )}
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

type Tab = "metrics" | "registrations" | "departures" | "packages" | "videos" | "payments" | "reviews" | "contacts";

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("metrics");

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: t.admin.tabMetrics },
    { key: "registrations", label: t.admin.tabRegistrations },
    { key: "departures", label: "Départs" },
    { key: "packages", label: "Forfaits" },
    { key: "videos", label: "Vidéos" },
    { key: "payments", label: t.admin.tabPayments },
    { key: "reviews", label: t.admin.tabReviews },
    { key: "contacts", label: t.admin.tabContacts },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-primary">{t.admin.dashboardTitle}</h1>
          <button onClick={onSignOut} className="text-sm text-muted-foreground hover:text-foreground">
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
        {tab === "departures" && <DeparturesAdmin />}
        {tab === "packages" && <PackagesAdmin />}
        {tab === "videos" && <VideosAdmin />}
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
  const [regs, setRegs] = useState<RegistrationIndexRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;
      const [regsResult, statsResult] = await Promise.allSettled([
        fetchRegistrations(token),
        fetchStats(token),
      ]);
      if (regsResult.status === "fulfilled") setRegs(regsResult.value);
      else console.error(regsResult.reason);
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      else console.error(statsResult.reason);
    })();
  }, []);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    regs.forEach((r) => {
      if (!r.departure_date) return;
      const d = new Date(r.departure_date);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long" });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [regs, lang]);

  const max = byMonth[0]?.[1] || 1;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title={t.admin.metricsTotal} value={regs.length} />
        <Card title={t.admin.metricsPaid} value={stats?.payments_confirmed ?? "—"} />
        <Card
          title={t.admin.metricsPending}
          value={stats ? Math.max(stats.payments_total - stats.payments_confirmed, 0) : "—"}
        />
        <Card title="Avis à valider" value={stats?.reviews_pending ?? "—"} />
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
                  <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Registrations() {
  const { t } = useLang();
  const [rows, setRows] = useState<RegistrationIndexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Les inscriptions ne sont plus en base : elles vivent dans Google Drive
        // (un dossier par pelerin) et sont indexees dans une Google Sheet, lue ici
        // via l'API FastAPI. Le token Supabase de l'admin sert a autoriser l'appel.
        setRows(await fetchRegistrations(requireToken()));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (error)
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-4">
        {error}
      </div>
    );
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
              <Th>Depart</Th>
              <Th>Dossier</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <Td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014"}</Td>
                <Td>{r.full_name}</Td>
                <Td>
                  <div>{r.email}</div>
                  <div className="text-xs text-muted-foreground">{r.phone}</div>
                </Td>
                <Td>{r.service_type}</Td>
                <Td>{r.departure_date || "\u2014"}</Td>
                <Td>
                  {r.drive_folder_link ? (
                    <a
                      href={r.drive_folder_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline text-xs"
                    >
                      {t.admin.viewPassport}
                    </a>
                  ) : (
                    "\u2014"
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

function Payments() {
  const { t } = useLang();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await fetchPayments(requireToken()));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirm = async (id: string) => {
    try {
      await confirmPayment(requireToken(), id);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (error) return <ErrorBox msg={error} />;
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

function ReviewsModeration() {
  const { t } = useLang();
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await fetchAllReviews(requireToken()));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const approve = async (id: string) => {
    try {
      await approveReview(requireToken(), id);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reject = async (id: string) => {
    if (!window.confirm("Supprimer cet avis ?")) return;
    try {
      await removeReview(requireToken(), id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (error) return <ErrorBox msg={error} />;
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
                <Badge ok={r.approved}>{r.approved ? "approuvé" : "en attente"}</Badge>
              </div>
              <p className="text-sm text-foreground italic">"{r.comment}"</p>
              <div className="text-xs text-muted-foreground mt-2">
                {r.service_type} {r.travel_period && `· ${r.travel_period}`}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {!r.approved && (
                <button
                  onClick={() => approve(r.id)}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full"
                >
                  {t.admin.approve}
                </button>
              )}
              <button
                onClick={() => reject(r.id)}
                className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full"
              >
                {t.admin.reject}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Contacts() {
  const { t } = useLang();
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await fetchContactMessages(requireToken()));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (error) return <ErrorBox msg={error} />;
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

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-4">{msg}</div>
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

/** Jeton de session admin pour les appels API protégés. */
const adminToken = async (): Promise<string> => requireToken();

function DeparturesAdmin() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState("20");

  const load = async () => {
    try {
      setRows(await fetchDepartures());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await adminToken();
      await createDeparture(token, {
        date,
        package_label: label.trim(),
        seats: Number(seats) || 0,
      });
      setDate("");
      setLabel("");
      setSeats("20");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer cette date de départ ?")) return;
    try {
      await deleteDeparture(await adminToken(), id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Ajouter une date de départ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="block sm:col-span-1">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Date *</span>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Forfait *</span>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Omra Confort"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Places</span>
            <input
              type="number"
              min={0}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "..." : "Ajouter"}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">{t.common.loading}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic">{t.admin.noData}</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <Th>Date</Th>
                  <Th>Forfait</Th>
                  <Th>Places</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <Td className="capitalize">{fmt(r.date)}</Td>
                    <Td>{r.package_label}</Td>
                    <Td>{r.seats}</Td>
                    <Td>
                      <button
                        onClick={() => remove(r.id)}
                        className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full"
                      >
                        Supprimer
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VideosAdmin() {
  const { t } = useLang();
  const [rows, setRows] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const load = async () => {
    try {
      setRows(await fetchVideos());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addVideo(await adminToken(), { title: title.trim(), youtube_url: url.trim() });
      setTitle("");
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Retirer cette vidéo du site ?")) return;
    try {
      await deleteVideo(await adminToken(), id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Ajouter une vidéo YouTube</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Titre *</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Omra décembre 2026"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Lien YouTube *</span>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Collez l'adresse de la vidéo depuis YouTube (formats acceptés : watch, youtu.be, shorts).
        </p>
        {error && <ErrorBox msg={error} />}
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "..." : "Publier"}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">{t.common.loading}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic">{t.admin.noData}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rows.map((v) => (
            <div key={v.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
              <div className="aspect-video bg-foreground/5">
                <iframe src={v.embed_url} title={v.title} className="w-full h-full border-0" loading="lazy" />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground truncate">{v.title}</span>
                <button
                  onClick={() => remove(v.id)}
                  className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full shrink-0"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_PACKAGE: PackageForm = {
  name: "",
  duration: "",
  price: "",
  description: "",
  features: "",
  sort_order: 0,
  active: true,
};

function PackagesAdmin() {
  const { t } = useLang();
  const [rows, setRows] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_PACKAGE);
  const [image, setImage] = useState<File | null>(null);

  const load = async () => {
    try {
      setRows(await fetchAllPackages(await adminToken()));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_PACKAGE);
    setImage(null);
  };

  const startEdit = (p: Package) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      duration: p.duration ?? "",
      price: p.price ?? "",
      description: p.description ?? "",
      features: p.features.join("\n"),
      sort_order: p.sort_order,
      active: p.active,
    });
    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await adminToken();
      if (editingId) await updatePackage(token, editingId, form, image);
      else await createPackage(token, form, image);
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce forfait ? Son image sera aussi effacée.")) return;
    try {
      await deletePackage(await adminToken(), id);
      setRows((rs) => rs.filter((r) => r.id !== id));
      if (editingId === id) reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const field = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm";
  const label = "block text-xs font-semibold text-foreground/80 mb-1.5";

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {editingId ? "Modifier le forfait" : "Ajouter un forfait"}
          </h3>
          {editingId && (
            <button type="button" onClick={reset} className="text-xs text-primary underline">
              Annuler la modification
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Nom *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Omra Confort"
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Durée</span>
            <input
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="15 jours"
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Prix</span>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="À partir de 1 450 000 FCFA"
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Ordre d'affichage</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              className={field}
            />
          </label>
        </div>

        <label className="block">
          <span className={label}>Description</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={field}
          />
        </label>

        <label className="block">
          <span className={label}>Inclusions — une par ligne</span>
          <textarea
            rows={4}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder={"Vol aller-retour\nVisa inclus\nHôtel 4 étoiles"}
            className={field}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <label className="block">
            <span className={label}>Image {editingId && "(laisser vide pour conserver l'actuelle)"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-semibold file:cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-foreground">Visible sur le site</span>
          </label>
        </div>

        {error && <ErrorBox msg={error} />}

        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "..." : editingId ? "Enregistrer" : "Ajouter"}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">{t.common.loading}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic">{t.admin.noData}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
              {p.image_url && (
                <div className="aspect-[4/3] bg-muted">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-foreground">{p.name}</span>
                  <Badge ok={p.active}>{p.active ? "visible" : "masqué"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.duration} {p.price && `· ${p.price}`}
                </div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {p.features.slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                  {p.features.length > 3 && <li>+ {p.features.length - 3} autres</li>}
                </ul>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-full"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
