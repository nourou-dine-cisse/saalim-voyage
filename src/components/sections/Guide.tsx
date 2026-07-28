import { useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";
import { Check, Ban } from "lucide-react";

export function Guide() {
  const { t } = useLang();
  const [tab, setTab] = useState<"omra" | "hajj">("omra");

  const activeSteps = tab === "omra" ? t.guide.steps : t.guide.hajjSteps;
  const activeTitle = tab === "omra" ? t.guide.stepsTitle : t.guide.hajjStepsTitle;

  return (
    <section id="guide" className="py-24 lg:py-32 bg-primary text-ivory relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.78 0.13 82) 0%, transparent 40%), radial-gradient(circle at 80% 80%, oklch(0.78 0.13 82) 0%, transparent 40%)" }} />
      <div className="container mx-auto px-4 lg:px-8 relative">
        <SectionHeading title={t.guide.title} subtitle={t.guide.subtitle} light />

        {/* Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex bg-ivory/10 border border-ivory/20 rounded-full p-1 backdrop-blur">
            <button
              onClick={() => setTab("omra")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === "omra" ? "bg-gradient-gold text-gold-foreground shadow-gold" : "text-ivory/80 hover:text-ivory"
              }`}
            >
              {t.guide.tabOmra}
            </button>
            <button
              onClick={() => setTab("hajj")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === "hajj" ? "bg-gradient-gold text-gold-foreground shadow-gold" : "text-ivory/80 hover:text-ivory"
              }`}
            >
              {t.guide.tabHajj}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-12 max-w-5xl mx-auto">
          <h3 className="font-display text-xl font-semibold text-gold mb-6 text-center">{activeTitle}</h3>
          <ol className={`grid grid-cols-1 sm:grid-cols-2 ${tab === "omra" ? "md:grid-cols-5" : "md:grid-cols-3"} gap-3`}>
            {activeSteps.map((s) => (
              <li key={s.n} className="bg-ivory/10 backdrop-blur border border-ivory/20 rounded-2xl p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-gold text-gold-foreground font-display font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.n}
                </div>
                <div className="font-display text-base font-semibold text-ivory mb-1">{s.t}</div>
                <p className="text-xs text-ivory/75 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Hajj practical advice — only on Hajj tab */}
        {tab === "hajj" && (
          <div className="mt-12 max-w-4xl mx-auto bg-ivory/10 backdrop-blur border border-gold/30 rounded-2xl p-6 lg:p-8">
            <h3 className="font-display text-xl font-semibold text-gold mb-4 text-center">{t.guide.hajjAdviceTitle}</h3>
            <ul className="space-y-2">
              {t.guide.hajjAdvice.map((a, i) => (
                <li key={i} className="text-sm text-ivory/90 flex items-start gap-2 leading-relaxed">
                  <span className="text-gold mt-0.5 shrink-0">✦</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Duas */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="font-display text-xl font-semibold text-gold mb-6 text-center">{t.guide.duasTitle}</h3>
          <div className="space-y-4">
            {t.guide.duas.map((d, i) => (
              <div key={i} className="bg-ivory text-foreground rounded-2xl p-6 lg:p-8 shadow-elegant">
                <div className="arabic text-2xl lg:text-3xl text-primary font-bold leading-loose mb-4 text-right">
                  {d.arabic}
                </div>
                <div className="text-sm italic text-muted-foreground mb-2">{d.translit}</div>
                <div className="text-base text-foreground leading-relaxed">{d.fr}</div>
                <div className="mt-3 inline-block bg-accent text-accent-foreground text-xs px-3 py-1 rounded-full">
                  {d.when}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Obligations & forbidden */}
        <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-ivory/10 backdrop-blur border border-ivory/20 rounded-2xl p-6">
            <h3 className="font-display text-base font-semibold text-gold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" /> {t.guide.obligationsTitle}
            </h3>
            <ul className="space-y-2">
              {t.guide.obligations.map((o, i) => (
                <li key={i} className="text-sm text-ivory/90 flex items-start gap-2">
                  <span className="text-gold mt-0.5">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-ivory/10 backdrop-blur border border-ivory/20 rounded-2xl p-6">
            <h3 className="font-display text-base font-semibold text-destructive-foreground mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5" /> {t.guide.forbiddenTitle}
            </h3>
            <ul className="space-y-2">
              {t.guide.forbidden.map((f, i) => (
                <li key={i} className="text-sm text-ivory/90 flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✕</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
