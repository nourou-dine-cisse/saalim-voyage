import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Send, Instagram } from "lucide-react";
import { z } from "zod";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { sendContactMessage } from "@/lib/api";

const PHONE = "+221789922020";
const EMAIL = "saalimvoyages@gmail.com";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
});

export function Contact() {
  const { t, lang } = useLang();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: String(fd.get("full_name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Erreur");
      return;
    }
    setSubmitting(true);
    try {
      await sendContactMessage({
        ...parsed.data,
        subject: parsed.data.subject || null,
        language: lang,
      });
      setDone(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t.register.error);
    } finally {
      setSubmitting(false);
    }
  };

  // Minimal QR codes via free chart API
  const qr = (data: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(data)}&color=15604D&bgcolor=FFFFFF`;

  return (
    <section id="contact" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.contact.title} subtitle={t.contact.subtitle} />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Coordinates */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold text-primary mb-4">{t.contact.offices}</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3"><MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" /><span className="text-foreground">{t.contact.dakar}</span></li>
                <li className="flex gap-3"><MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" /><span className="text-foreground">{t.contact.kaolack}</span></li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${PHONE}`} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-soft transition-all">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{t.contact.callDirect}</span>
                <span className="text-[11px] text-muted-foreground">+221 78 992 20 20</span>
              </a>
              <a href={`https://wa.me/${PHONE.replace("+", "")}`} target="_blank" rel="noopener" className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-soft transition-all">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{t.contact.whatsapp}</span>
                <span className="text-[11px] text-muted-foreground">+221 78 992 20 20</span>
              </a>
              <a href={`mailto:${EMAIL}`} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-soft transition-all">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{t.contact.email}</span>
                <span className="text-[11px] text-muted-foreground break-all">{EMAIL}</span>
              </a>
              <a href="https://instagram.com/saalimvoyages" target="_blank" rel="noopener" className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-soft transition-all">
                <Instagram className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Instagram</span>
                <span className="text-[11px] text-muted-foreground">@saalimvoyages</span>
              </a>
            </div>

          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-primary mb-5 flex items-center gap-2">
              <Send className="w-4 h-4" /> {t.contact.formTitle}
            </h3>
            {done ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-foreground">{t.contact.formSuccess}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <input name="full_name" required placeholder={t.contact.formName} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input name="email" type="email" required placeholder={t.contact.formEmail} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input name="subject" placeholder={t.contact.formSubject} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <textarea name="message" required rows={5} placeholder={t.contact.formMessage} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3">{error}</div>}
                <button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-full font-semibold shadow-soft hover:shadow-elegant transition-all disabled:opacity-60">
                  {submitting ? t.register.submitting : t.contact.formSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function QrTile({ label, src }: { label: string; src: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-full aspect-square bg-ivory rounded-xl p-1.5 border border-border">
        <img src={src} alt={`QR ${label}`} className="w-full h-full" loading="lazy" />
      </div>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
    </div>
  );
}
