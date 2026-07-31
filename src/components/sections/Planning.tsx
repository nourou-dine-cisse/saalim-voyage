import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { useLang, toHijri } from "@/i18n/LangContext";
import { Calendar } from "lucide-react";
import { fetchDepartures, type Departure as ApiDeparture } from "@/lib/api";

interface Departure {
  date: Date;
  pkg: string;
  seats: number;
}

export function Planning() {
  const { t, lang } = useLang();
  const [apiDepartures, setApiDepartures] = useState<ApiDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  // Les dates sont gerees depuis la page admin (API -> Google Sheets).
  useEffect(() => {
    (async () => {
      try {
        setApiDepartures(await fetchDepartures());
      } catch (err) {
        console.error("chargement des departs impossible", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const departures = useMemo<Departure[]>(
    () =>
      apiDepartures
        .map((d) => ({ date: new Date(d.date), pkg: d.package_label, seats: d.seats }))
        .filter((d) => !Number.isNaN(d.date.getTime())),
    [apiDepartures],
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <section id="planning" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.planning.title} subtitle={t.planning.subtitle} />

        {loading ? (
          <p className="mt-16 text-center text-muted-foreground">{t.common.loading}</p>
        ) : departures.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground italic">{t.planning.subtitle}</p>
        ) : (
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {departures.map((dep, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected((prev) => (prev === i ? null : i))}
                className={`text-left bg-card border-2 rounded-2xl p-5 transition-all duration-300 ${
                  isSelected
                    ? "border-primary shadow-elegant scale-[1.02]"
                    : "border-border hover:border-gold hover:shadow-soft"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {dep.seats} {t.planning.seatsLeft}
                  </span>
                </div>
                <div className="font-display text-base font-semibold text-foreground capitalize">
                  {fmt(dep.date)}
                </div>
                <div className="text-xs text-gold font-medium mt-1">≈ {toHijri(dep.date)}</div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-primary font-semibold">{dep.pkg}</span>
                  {isSelected && <span className="text-xs text-primary font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        )}

        {selected !== null && (
          <div className="mt-8 text-center animate-float-up">
            <button
              onClick={() => {
                const dep = departures[selected];
                const service = dep.pkg.toLowerCase().includes("hajj") ? "hajj_full" : "omra_full";
                const isoDate = dep.date.toISOString().slice(0, 10);
                window.dispatchEvent(
                  new CustomEvent("saalim:prefill", { detail: { service, departureDate: isoDate } }),
                );
                document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex bg-gradient-gold text-gold-foreground px-8 py-4 rounded-full font-semibold shadow-gold hover:scale-105 transition-all"
            >
              {t.planning.bookThis}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
