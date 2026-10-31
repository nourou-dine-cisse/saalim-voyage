import { Plane, Hotel, BookOpen, ShieldCheck, Clock, MapPin, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

export function OumraSenegal() {
  const { t } = useLang();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const icons = [
    <Plane key="plane" className="w-6 h-6 text-gold" />,
    <Hotel key="hotel" className="w-6 h-6 text-gold" />,
    <BookOpen key="book" className="w-6 h-6 text-gold" />,
    <ShieldCheck key="shield" className="w-6 h-6 text-gold" />,
    <Clock key="clock" className="w-6 h-6 text-gold" />,
    <MapPin key="pin" className="w-6 h-6 text-gold" />,
  ];

  return (
    <section id="oumra-senegal" className="py-24 lg:py-32 bg-card border-y border-border relative overflow-hidden">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold tracking-wide uppercase">
              {t.oumraSenegal.tag}
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight text-balance">
            {t.oumraSenegal.title}
          </h2>

          <p className="mt-4 text-base lg:text-lg text-muted-foreground leading-relaxed">
            {t.oumraSenegal.subtitle}
          </p>
        </div>

        {/* 6 Key pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {t.oumraSenegal.features.map((item, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-gold/50 transition-all duration-300 hover:shadow-elegant flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {icons[i] || <ShieldCheck className="w-6 h-6 text-gold" />}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-hero text-ivory border border-gold/30 shadow-elegant">
          {t.oumraSenegal.stats.map((s, idx) => (
            <div key={idx} className="text-center p-3">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gold mb-1">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-ivory/80 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* SEO Call to Action Box */}
        <div className="mt-12 text-center">
          <button
            onClick={() => scrollTo("register")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-gold text-gold-foreground font-semibold hover:scale-105 transition-transform shadow-gold"
          >
            <span>Démarrer mon inscription Oumra</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
