import { Play } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import pilgrims from "@/assets/pilgrims.jpg";
import medina from "@/assets/medina-mosque.jpg";
import hira from "@/assets/place-hira.jpg";

const thumbs = [pilgrims, medina, hira];

export function Videos() {
  const { t } = useLang();
  return (
    <section id="videos" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.videos.title} subtitle={t.videos.subtitle} />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {thumbs.map((src, i) => (
            <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden shadow-soft cursor-pointer">
              <img src={src} alt={`Vidéo Saalim ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-ivory/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
                  <Play className="w-7 h-7 text-primary ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 bg-foreground/70 backdrop-blur text-ivory text-xs px-2 py-1 rounded-full">
                {t.videos.placeholder}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
