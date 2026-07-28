import { useState } from "react";
import { X, Check } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import medinaImg from "@/assets/medina-mosque.jpg";
import pilgrimsImg from "@/assets/pilgrims.jpg";
import heroImg from "@/assets/hero-kaaba.jpg";
import quba from "@/assets/place-quba.jpg";

const images = [heroImg, medinaImg, pilgrimsImg, quba];

export function Packages() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="packages" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.packages.title} subtitle={t.packages.subtitle} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {t.packages.items.map((p, i) => (
            <article
              key={i}
              className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={images[i % images.length]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-display text-xl font-semibold text-foreground">{p.name}</h3>
                  <span className="text-xs text-muted-foreground">{p.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.desc}</p>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-primary font-semibold text-sm">{p.price}</span>
                </div>
                <button
                  onClick={() => setOpen(i)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-full shadow-soft hover:shadow-elegant hover:scale-[1.02] transition-all"
                >
                  {t.packages.details}
                  <span aria-hidden>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal viewer */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 animate-float-up"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-card max-w-3xl w-full rounded-2xl overflow-hidden shadow-elegant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9]">
              <img
                src={images[open % images.length]}
                alt={t.packages.items[open].name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setOpen(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-soft hover:scale-110 transition-all"
                aria-label={t.packages.close}
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-display text-3xl font-semibold text-foreground">
                    {t.packages.items[open].name}
                  </h3>
                  <span className="text-sm text-muted-foreground">{t.packages.items[open].duration}</span>
                </div>
                <span className="text-2xl font-semibold text-primary">{t.packages.items[open].price}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">{t.packages.items[open].desc}</p>

              <div className="bg-muted rounded-xl p-5 mb-6">
                <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
                  {t.packages.includes}
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {t.packages.items[open].features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setOpen(null);
                    setTimeout(() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                  className="flex-1 bg-gradient-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-soft hover:shadow-elegant transition-all"
                >
                  {t.nav.register}
                </button>
                <button
                  onClick={() => setOpen(null)}
                  className="flex-1 sm:flex-initial bg-muted text-foreground px-6 py-3 rounded-full font-semibold hover:bg-accent transition-all"
                >
                  {t.packages.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="divider-ornament mb-4">
        <span className="text-gold text-2xl">✦</span>
      </div>
      <h2 className="font-display text-3xl lg:text-5xl font-semibold text-foreground text-balance">{title}</h2>
      <p className="mt-4 text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  );
}
