import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { fetchPlaces, type Place } from "@/lib/api";
import medina from "@/assets/medina-mosque.jpg";
import uhud from "@/assets/place-uhud.jpg";
import hira from "@/assets/place-hira.jpg";
import quba from "@/assets/place-quba.jpg";

// Visuels de secours pour les lieux saisis sans image.
const fallbacks = [medina, uhud, hira, quba];

export function Places() {
  const { t } = useLang();
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  // Les lieux sont gérés depuis la page admin.
  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchPlaces());
      } catch (err) {
        console.error("chargement des lieux impossible", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const imageFor = (p: Place, i: number) => p.image_url || fallbacks[i % fallbacks.length];

  return (
    <section id="places" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.places.title} subtitle={t.places.subtitle} />

        {loading ? (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border aspect-[16/10] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground italic">{t.places.subtitle}</p>
        ) : (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {items.map((p, i) => (
              <article
                key={p.id}
                className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 cursor-pointer"
                onClick={() => setOpen(i)}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={imageFor(p, i)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-ivory">
                  {p.location && (
                    <div className="flex items-center gap-1.5 text-gold text-xs uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {p.location}
                    </div>
                  )}
                  <h3 className="font-display text-2xl font-semibold mb-1">{p.name}</h3>
                  {p.description && <p className="text-sm text-ivory/85 line-clamp-2">{p.description}</p>}
                  <span className="inline-block mt-3 text-xs font-semibold text-gold">{t.places.learnMore} →</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {open !== null && items[open] && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 animate-float-up"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-card max-w-2xl w-full rounded-2xl overflow-hidden shadow-elegant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9]">
              <img src={imageFor(items[open], open)} alt={items[open].name} className="w-full h-full object-cover" />
              <button
                onClick={() => setOpen(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-soft"
                aria-label={t.packages.close}
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="p-8">
              {items[open].location && (
                <div className="flex items-center gap-1.5 text-gold text-xs uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {items[open].location}
                </div>
              )}
              <h3 className="font-display text-3xl font-semibold text-foreground mb-3">{items[open].name}</h3>
              {items[open].description && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{items[open].description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
