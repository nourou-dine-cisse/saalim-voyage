import { useLang } from "@/i18n/LangContext";

export function SectionHeading({ title, subtitle, light = false }: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="divider-ornament mb-4">
        <span className="text-gold text-2xl">✦</span>
      </div>
      <h2 className={`font-display text-3xl lg:text-5xl font-semibold text-balance ${light ? "text-ivory" : "text-foreground"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 leading-relaxed ${light ? "text-ivory/80" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function useT() {
  return useLang().t;
}
