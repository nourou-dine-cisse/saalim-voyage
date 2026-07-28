import { useState } from "react";
import { Check } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";

export function Services() {
  const { t } = useLang();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected((prev) => (prev === value ? null : value));
  };

  const goToRegister = (value: string) => {
    window.dispatchEvent(
      new CustomEvent("saalim:prefill", { detail: { service: value } }),
    );
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="services" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.services.title} subtitle={t.services.subtitle} />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {t.services.items.map((s, i) => {
            const isSelected = selected === s.value;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s.value)}
                className={`group relative text-left bg-card border-2 rounded-2xl p-6 transition-all duration-500 overflow-hidden ${
                  isSelected
                    ? "border-primary shadow-elegant -translate-y-1"
                    : "border-border hover:border-gold hover:shadow-elegant hover:-translate-y-1"
                }`}
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                {isSelected && (
                  <span className="absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-soft">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-3xl mb-4 shadow-soft">
                    {s.icon}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{s.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  {isSelected && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToRegister(s.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          goToRegister(s.value);
                        }
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 bg-gradient-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full shadow-soft hover:shadow-elegant cursor-pointer"
                    >
                      {t.services.goRegister}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 max-w-3xl mx-auto bg-gradient-primary rounded-2xl p-6 lg:p-8 shadow-elegant text-center">
          <div className="text-gold text-3xl mb-3">☪</div>
          <p className="text-ivory text-sm lg:text-base leading-relaxed">{t.services.tontineNote}</p>
        </div>
      </div>
    </section>
  );
}
