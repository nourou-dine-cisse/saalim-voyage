import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { fetchVideos, type Video } from "@/lib/api";

export function Videos() {
  const { t } = useLang();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Les vidéos sont ajoutées depuis la page admin (upload → Drive, index en Sheet).
  useEffect(() => {
    (async () => {
      try {
        setVideos(await fetchVideos());
      } catch (err) {
        console.error("chargement des vidéos impossible", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section id="videos" className="py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.videos.title} subtitle={t.videos.subtitle} />

        {loading ? (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center">
              <Play className="w-6 h-6 text-primary ml-0.5" fill="currentColor" />
            </div>
            <p className="italic">{t.videos.placeholder}</p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {videos.map((v) => (
              <figure key={v.id} className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-soft bg-foreground/5">
                  <iframe
                    src={v.embed_url}
                    title={v.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
                <figcaption className="text-sm font-medium text-foreground text-center">{v.title}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
