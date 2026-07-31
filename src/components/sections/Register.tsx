import { useEffect, useState } from "react";
import { z } from "zod";
import { useLang } from "@/i18n/LangContext";
import { SectionHeading } from "./SectionHeading";
import { submitRegistration } from "@/lib/api";
import { AlertTriangle, Upload } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  service_type: z.enum(["omra_full", "hajj_full", "visa_only", "flight_only", "tontine", "custom"]),
  departure_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export function Register() {
  const { t, lang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportOk, setPassportOk] = useState(false);
  const [consent, setConsent] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [serviceValue, setServiceValue] = useState<string>("omra_full");
  const [departureValue, setDepartureValue] = useState<string>("");

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ service?: string; departureDate?: string }>).detail || {};
      if (detail.service) setServiceValue(detail.service);
      if (detail.departureDate) setDepartureValue(detail.departureDate);
    };
    window.addEventListener("saalim:prefill", onPrefill);
    return () => window.removeEventListener("saalim:prefill", onPrefill);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError(lang === "fr" ? "Format non supporté (PDF, JPG, PNG)." : "Unsupported format (PDF, JPG, PNG).");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(lang === "fr" ? "Fichier trop lourd (max 5 Mo)." : "File too large (max 5 MB).");
      return;
    }
    setError(null);
    setPassportFile(f);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!passportOk) {
      setError(t.register.passportRequired);
      return;
    }
    if (!consent) {
      setError(t.register.consentRequired);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: String(fd.get("full_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      country: String(fd.get("country") || ""),
      city: String(fd.get("city") || ""),
      service_type: String(fd.get("service_type") || "omra_full") as
        | "omra_full"
        | "hajj_full"
        | "visa_only"
        | "flight_only"
        | "tontine"
        | "custom",
      departure_date: String(fd.get("departure_date") || ""),
      notes: String(fd.get("notes") || ""),
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || t.register.error);
      return;
    }

    setSubmitting(true);
    try {
      // L'API FastAPI cree le dossier Drive du pelerin (fiche + passeport),
      // l'ajoute a la feuille d'index et notifie l'agence par e-mail.
      await submitRegistration(
        {
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          whatsapp: parsed.data.whatsapp,
          country: parsed.data.country,
          city: parsed.data.city,
          service_type: parsed.data.service_type,
          departure_date: parsed.data.departure_date,
          notes: parsed.data.notes,
          passport_valid_6_months: passportOk,
          language: lang,
        },
        passportFile,
      );

      setDone(true);
      (e.target as HTMLFormElement).reset();
      setPassportOk(false);
      setConsent(false);
      setPassportFile(null);
    } catch (err) {
      console.error(err);
      setError(t.register.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="register" className="py-24 lg:py-32 bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.register.title} subtitle={t.register.subtitle} />

        <div className="mt-12 max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-elegant">
          {done ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✓</div>
              <p className="text-lg text-foreground font-medium">{t.register.success}</p>
              <button
                onClick={() => setDone(false)}
                className="mt-6 text-sm text-primary font-semibold underline"
              >
                {t.nav.register}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-accent/60 border border-gold/40 rounded-xl p-4 flex gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <p className="text-accent-foreground leading-relaxed">{t.register.passportWarning}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field name="full_name" label={t.register.fullName} required />
                <Field name="email" label={t.register.email} type="email" required />
                <Field name="phone" label={t.register.phone} required placeholder="+221 ..." />
                <Field name="whatsapp" label={t.register.whatsapp} placeholder="+221 ..." />
                <Field name="country" label={t.register.country} />
                <Field name="city" label={t.register.city} />
                <SelectField
                  name="service_type"
                  label={t.register.service}
                  options={t.register.services}
                  value={serviceValue}
                  onChange={setServiceValue}
                />
                <Field
                  name="departure_date"
                  label={t.register.departureDate}
                  type="date"
                  value={departureValue}
                  onChange={(v) => setDepartureValue(v)}
                />
              </div>

              <Field name="notes" label={t.register.notes} textarea />

              <label className="block">
                <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  {t.register.passportUpload}
                </span>
                <div className="flex items-center gap-3 bg-background border border-dashed border-border rounded-xl px-4 py-3 hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFile}
                    className="text-sm text-foreground flex-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-semibold file:cursor-pointer"
                  />
                </div>
                <span className="block text-xs text-muted-foreground mt-1">{t.register.passportUploadHelp}</span>
                {passportFile && (
                  <span className="block text-xs text-primary mt-1 font-medium">✓ {passportFile.name}</span>
                )}
              </label>

              <label className="flex items-start gap-3 text-sm cursor-pointer p-3 bg-muted rounded-xl">
                <input
                  type="checkbox"
                  checked={passportOk}
                  onChange={(e) => setPassportOk(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-foreground">{t.register.passportCheck}</span>
              </label>

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span className="text-muted-foreground leading-relaxed">{t.register.consent}</span>
              </label>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-primary text-primary-foreground py-4 rounded-full font-semibold shadow-soft hover:shadow-elegant transition-all disabled:opacity-60"
              >
                {submitting ? t.register.submitting : t.register.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  textarea,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const base =
    "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <label className={`block ${textarea ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-foreground/80 mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={base} />
      ) : controlled ? (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange!(e.target.value)}
          className={base}
        />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} className={base} />
      )}
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: Record<string, string>;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-foreground/80 mb-1.5">{label}</span>
      <select
        name={name}
        {...(controlled
          ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange!(e.target.value) }
          : { defaultValue: "omra_full" })}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
