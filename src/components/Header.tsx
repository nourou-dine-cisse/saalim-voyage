import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { LangSwitcher } from "./LangSwitcher";
import logo from "@/assets/logo.jpeg";

const sections = [
  { id: "packages", key: "packages" as const },
  { id: "planning", key: "planning" as const },
  { id: "services", key: "services" as const },
  { id: "places", key: "places" as const },
  { id: "guide", key: "guide" as const },
  { id: "reviews", key: "reviews" as const },
  { id: "faq", key: "faq" as const },
  { id: "contact", key: "contact" as const },
];

export function Header() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-lg shadow-soft border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-elegant transition-all">
            {/*<span className="text-primary-foreground font-display font-bold text-lg">S</span>*/}
            <img
              src={logo}
              alt="Saalim Voyages"
              className="w-10 h-10 rounded-full object-cover shadow-soft group-hover:shadow-elegant transition-all"
            />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-base lg:text-lg text-foreground">Saalim Voyages</div>
            <div className="text-[10px] lg:text-[11px] text-muted-foreground tracking-wide uppercase">Omra · Hajj</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {t.nav[s.key]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitcher />
          <button
            onClick={() => scrollTo("register")}
            className="hidden md:inline-flex bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-soft hover:shadow-elegant transition-all"
          >
            {t.nav.register}
          </button>
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-background border-t border-border shadow-elegant">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg"
              >
                {t.nav[s.key]}
              </button>
            ))}
            <button
              onClick={() => scrollTo("register")}
              className="mt-2 bg-gradient-primary text-primary-foreground px-4 py-3 rounded-full text-sm font-semibold"
            >
              {t.nav.register}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
