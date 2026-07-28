import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import medina from "@/assets/medina-mosque.jpg";
import uhud from "@/assets/place-uhud.jpg";
import hira from "@/assets/place-hira.jpg";
import quba from "@/assets/place-quba.jpg";

const images = [medina, uhud, hira, quba];

export function Places() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="places" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.places.title} subtitle={t.places.subtitle} />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {t.places.items.map((p, i) => (
            <article
              key={i}
              className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 cursor-pointer"
              onClick={() => setOpen(i)}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={images[i]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-ivory">
                <div className="flex items-center gap-1.5 text-gold text-xs uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {p.city}
                </div>
                <h3 className="font-display text-2xl font-semibold mb-1">{p.name}</h3>
                <p className="text-sm text-ivory/85 line-clamp-2">{p.desc}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-gold">{t.places.learnMore} →</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 animate-float-up"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-card max-w-2xl w-full rounded-2xl overflow-hidden shadow-elegant max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9]">
              <img src={images[open]} alt={t.places.items[open].name} className="w-full h-full object-cover" />
              <button
                onClick={() => setOpen(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-soft"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-1.5 text-gold text-xs uppercase tracking-wider mb-1">
                <MapPin className="w-3.5 h-3.5" />
                {t.places.items[open].city}
              </div>
              <h3 className="font-display text-3xl font-semibold text-foreground mb-3">{t.places.items[open].name}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{t.places.items[open].desc}</p>
              <div className="bg-muted rounded-xl p-5 border-l-4 border-gold">
                <p className="text-sm text-foreground leading-relaxed">{t.places.items[open].history}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
