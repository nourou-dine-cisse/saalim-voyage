import { useLang } from "@/i18n/LangContext";
import logo from "@/assets/logo.jpeg";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-foreground text-ivory py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                {/*<span className="text-gold-foreground font-display font-bold text-lg">S</span>*/}
              <img
                src={logo}
                alt="Saalim Voyages"
                className="w-10 h-10 rounded-full object-cover shadow-soft group-hover:shadow-elegant transition-all"
              />
              </div>
              <div>
                <div className="font-display font-semibold">Saalim Voyages</div>
                <div className="text-[10px] text-ivory/60 uppercase tracking-wide">Omra · Hajj</div>
              </div>
            </div>
            <p className="text-sm text-ivory/70 leading-relaxed max-w-md">{t.footer.tagline}</p>
            <p className="text-xs text-ivory/50 leading-relaxed mt-4 max-w-md">{t.footer.gdprNote}</p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-gold mb-3 uppercase tracking-wide">Contact</h4>
            <ul className="space-y-2 text-sm text-ivory/70">
              <li>saalimvoyages@gmail.com</li>
              <li>+221 78 992 20 20</li>
              <li>Dakar — Sacré-Cœur 3</li>
              <li>Kaolack — Médina Baye</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-gold mb-3 uppercase tracking-wide">Légal</h4>
            <ul className="space-y-2 text-sm text-ivory/70">
              <li><a href="#" className="hover:text-gold transition-colors">{t.footer.legal}</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">{t.footer.privacy}</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">{t.footer.rgpd}</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">{t.footer.terms}</a></li>
            </ul>
          </div>
        </div>

        <div className="divider-ornament my-8 opacity-40">
          <span className="text-gold">✦</span>
        </div>

        <p className="text-center text-xs text-ivory/50">{t.footer.copyright}</p>
      </div>
    </footer>
  );
}
