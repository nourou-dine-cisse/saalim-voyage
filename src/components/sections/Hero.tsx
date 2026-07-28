import heroImg from "@/assets/hero-kaaba.jpg";
import { useLang } from "@/i18n/LangContext";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const { t } = useLang();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  // Duplicate so the vertical loop is seamless
  const rotating = [...t.hero.rotating, ...t.hero.rotating];

  return (
    <section id="home" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Vue de la Kaaba à La Mecque"
          className="w-full h-full object-cover scale-105"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 backdrop-blur mb-6 animate-float-up">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs font-semibold tracking-wide uppercase">{t.hero.eyebrow}</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-semibold text-ivory leading-tight max-w-4xl mx-auto text-balance animate-float-up" style={{ animationDelay: "0.1s" }}>
          {t.hero.title}
        </h1>

        <p className="mt-6 text-base lg:text-lg text-ivory/85 max-w-2xl mx-auto leading-relaxed animate-float-up" style={{ animationDelay: "0.2s" }}>
          {t.hero.subtitle}
        </p>

        {/* Vertical rotating badge — service paired with its CTA */}
        <div
          className="mt-10 mx-auto max-w-xl bg-ivory/10 backdrop-blur border border-gold/30 rounded-2xl overflow-hidden animate-float-up"
          style={{ animationDelay: "0.4s", height: "64px" }}
          aria-label="Services Saalim"
        >
          <div className="animate-marquee-vertical flex flex-col">
            {rotating.map((item, i) => (
              <div
                key={i}
                className="h-16 shrink-0 flex items-center justify-between px-5 gap-3"
              >
                <button
                  onClick={() => scrollTo(item.anchor)}
                  className="flex items-center gap-2 text-ivory text-sm font-semibold hover:text-gold transition-colors text-left"
                >
                  <span className="text-gold">✦</span>
                  {item.label}
                </button>
                <button
                  onClick={() => scrollTo(item.ctaAnchor)}
                  className="inline-flex items-center gap-1.5 bg-gradient-gold text-gold-foreground text-xs font-semibold px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-gold whitespace-nowrap"
                >
                  {item.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
