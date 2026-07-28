import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang } from "@/i18n/LangContext";

export function FAQ() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeading title={t.faq.title} />
        <div className="mt-16 max-w-3xl mx-auto space-y-3">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                >
                  <span className="font-display text-base font-semibold text-foreground">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
