import { useState } from "react";
import { z } from "zod";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { declarePayment } from "@/lib/api";
import qrWave from "@/assets/qr-wave.jpg";
import qrOrange from "@/assets/qr-orange.jpg";
import { Shield, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "221789922020";

const schema = z.object({
  payer_name: z.string().trim().min(2).max(100),
  payer_phone: z.string().trim().min(6).max(30),
  amount: z.coerce.number().positive().max(100_000_000).optional(),
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export function Payment() {
  const { t } = useLang();
  const [method, setMethod] = useState<"wave" | "orange">("wave");
  const [installment, setInstallment] = useState<"full" | "installment">("full");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayer, setLastPayer] = useState<string>("");
  const [lastAmount, setLastAmount] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      payer_name: String(fd.get("payer_name") || ""),
      payer_phone: String(fd.get("payer_phone") || ""),
      amount: String(fd.get("amount") || ""),
      reference: String(fd.get("reference") || ""),
      notes: String(fd.get("notes") || ""),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Erreur");
      return;
    }
    setSubmitting(true);
    try {
      await declarePayment({
        payer_name: parsed.data.payer_name,
        payer_phone: parsed.data.payer_phone,
        amount: parsed.data.amount ?? null,
        method,
        installment_type: installment,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
      });
      setLastPayer(parsed.data.payer_name);
      setLastAmount(parsed.data.amount ? String(parsed.data.amount) : "");
      setDone(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const waText = encodeURIComponent(
    `Saalim Voyages — Déclaration de paiement\nNom: ${lastPayer}\nMontant: ${lastAmount} FCFA\nMéthode: ${method === "wave" ? "Wave" : "Orange Money"}\n(Voir capture jointe)`,
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  return (
    <section id="payment" className="py-24 lg:py-32 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.payment.title} subtitle={t.payment.subtitle} />

        {/* Step 1 — choose method */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t.payment.step1}</h3>
          <div className="grid grid-cols-2 gap-4">
            <MethodTile
              active={method === "wave"}
              onClick={() => setMethod("wave")}
              label={t.payment.wave}
              accent="bg-[#00B4FF]"
            />
            <MethodTile
              active={method === "orange"}
              onClick={() => setMethod("orange")}
              label={t.payment.orange}
              accent="bg-[#FF6600]"
            />
          </div>
        </div>

        {/* Step 2 — QR */}
        <div className="mt-10 max-w-4xl mx-auto">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t.payment.step2}</h3>
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 bg-white p-3 rounded-2xl shadow-soft">
              <img
                src={method === "wave" ? qrWave : qrOrange}
                alt={`QR marchand ${method === "wave" ? "Wave" : "Orange Money"}`}
                className="w-56 h-56 object-contain"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-foreground leading-relaxed">{t.payment.qrInstructions}</p>
              <div className="mt-6 inline-flex items-center gap-2 bg-accent/60 border border-gold/40 rounded-xl px-4 py-3 text-sm">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-accent-foreground">{t.payment.securityNote}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 — declare */}
        <div className="mt-10 max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground">{t.payment.declareTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{t.payment.declareSubtitle}</p>

          {done ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-4xl">✓</div>
              <p className="text-foreground">{t.payment.success}</p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:scale-105 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                {t.payment.sendWhatsApp}
              </a>
              <button onClick={() => setDone(false)} className="block mx-auto text-xs text-primary underline mt-2">
                {t.common.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  {t.payment.installmentType}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <RadioPill active={installment === "full"} onClick={() => setInstallment("full")}>
                    {t.payment.modeFull}
                  </RadioPill>
                  <RadioPill active={installment === "installment"} onClick={() => setInstallment("installment")}>
                    {t.payment.modeInstallment}
                  </RadioPill>
                </div>
                {installment === "installment" && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{t.payment.installmentNote}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field name="payer_name" label={t.payment.payerName} required />
                <Field name="payer_phone" label={t.payment.payerPhone} required placeholder="+221 ..." />
                <Field name="amount" label={t.payment.amount} type="number" required />
                <Field name="reference" label={t.payment.reference} placeholder={t.payment.referencePlaceholder} />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-full font-semibold shadow-soft disabled:opacity-60"
              >
                {submitting ? "..." : t.payment.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function MethodTile({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 rounded-2xl border-2 transition-all text-left ${
        active ? "border-primary shadow-elegant scale-[1.02] bg-card" : "border-border bg-card hover:border-gold"
      }`}
    >
      <div className={`w-10 h-10 rounded-full ${accent} mb-3`} />
      <div className="font-display font-semibold text-foreground">{label}</div>
    </button>
  );
}

function RadioPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
    </label>
  );
}
