import { useLang } from "@/i18n/LangContext";
import type { Lang } from "@/i18n/translations";

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const opt = (l: Lang, label: string) => (
    <button
      key={l}
      onClick={() => setLang(l)}
      className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
        lang === l ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-label={`Switch to ${label}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 backdrop-blur p-0.5">
      {opt("fr", "FR")}
      {opt("en", "EN")}
    </div>
  );
}
