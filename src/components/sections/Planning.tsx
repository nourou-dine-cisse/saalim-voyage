import { useEffect, useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { useLang, toHijri } from "@/i18n/LangContext";
import { Calendar, Users } from "lucide-react";
import { fetchDepartures, type Departure } from "@/lib/api";
import medina from "@/assets/medina-mosque.jpg";
import pilgrims from "@/assets/pilgrims.jpg";
import hero from "@/assets/hero-kaaba.jpg";
import quba from "@/assets/place-quba.jpg";

// Visuels de secours pour les départs saisis sans image.
const fallbacks = [hero, medina, pilgrims, quba];

export function Planning() {
  const { t, lang } = useLang();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Les dates sont gérées depuis la page admin.
  useEffect(() => {
    (async () => {
      try {
        setDepartures(await fetchDepartures());
      } catch (err) {
        console.error("chargement des départs impossible", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const hijriOf = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : toHijri(d);
  };

  const book = (dep: Departure) => {
    const service = dep.package_label.toLowerCase().includes("hajj") ? "hajj_full" : "omra_full";
    window.dispatchEvent(new CustomEvent("saalim:prefill", { detail: { service, departureDate: dep.date } }));
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="planning" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.planning.title} subtitle={t.planning.subtitle} />

        {loading ? (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : departures.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground italic">{t.planning.subtitle}</p>
        ) : (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {departures.map((dep, i) => {
              const isSelected = selected === dep.id;
              const hijri = hijriOf(dep.date);
              return (
                <article
                  key={dep.id}
                  onClick={() => setSelected((prev) => (prev === dep.id ? null : dep.id))}
                  className={`group cursor-pointer bg-card border-2 rounded-2xl overflow-hidden transition-all duration-500 ${
                    isSelected
                      ? "border-primary shadow-elegant -translate-y-1"
                      : "border-border hover:border-gold hover:shadow-elegant hover:-translate-y-1"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={dep.image_url || fallbacks[i % fallbacks.length]}
                      alt={dep.package_label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-soft">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground">
                        {dep.seats} {t.planning.seatsLeft}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold text-foreground capitalize leading-tight">
                          {fmt(dep.date)}
                        </div>
                        {hijri && <div className="text-xs text-gold font-medium mt-0.5">≈ {hijri}</div>}
                      </div>
                    </div>

                    <div className="text-sm text-primary font-semibold">{dep.package_label}</div>
                    {dep.description && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {dep.description}
                      </p>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        book(dep);
                      }}
                      className="mt-5 w-full bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-full shadow-soft hover:shadow-elegant hover:scale-[1.02] transition-all"
                    >
                      {t.planning.bookThis}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
