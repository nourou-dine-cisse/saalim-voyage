import { createFileRoute } from "@tanstack/react-router";
import { LangProvider } from "@/i18n/LangContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Packages } from "@/components/sections/Packages";
import { OumraSenegal } from "@/components/sections/OumraSenegal";
import { Planning } from "@/components/sections/Planning";
import { Services } from "@/components/sections/Services";
import { Places } from "@/components/sections/Places";
import { Guide } from "@/components/sections/Guide";
import { Reviews } from "@/components/sections/Reviews";
import { Videos } from "@/components/sections/Videos";
import { FAQ } from "@/components/sections/FAQ";
import { Register } from "@/components/sections/Register";
import { Payment } from "@/components/sections/Payment";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oumra Sénégal — Saalim Voyages | Agence Hajj & Omra Dakar" },
      {
        name: "description",
        content:
          "Agence Saalim Voyages agréée au Sénégal : forfaits Oumra et Hajj complets depuis Dakar, visas, billets d'avion, tontine halal sans riba, hôtels proches du Haram à La Mecque et Médine. Réservez votre pèlerinage.",
      },
      {
        name: "keywords",
        content:
          "oumra senegal, omra senegal, oumra sénégal 2025, oumra sénégal 2026, agence oumra dakar, hajj senegal, forfait oumra senegal, prix oumra senegal, voyage la mecque senegal, tontine oumra, visa omra senegal, saalim voyages, saalimvoyage.com",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Oumra Sénégal — Saalim Voyages | Agence Omra & Hajj Dakar" },
      {
        property: "og:description",
        content:
          "Voyage sacré et spirituel pour l'Oumra et le Hajj au départ du Sénégal. Forfaits tout compris, guides religieux, hôtels à La Mecque et Médine, tontine sans riba.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://saalimvoyage.com/" },
      { property: "og:site_name", content: "Saalim Voyages" },
      { property: "og:locale", content: "fr_SN" },
      { property: "og:image", content: "https://saalimvoyage.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Oumra Sénégal — Saalim Voyages | Agence Omra & Hajj Dakar" },
      {
        name: "twitter:description",
        content:
          "Votre agence de référence pour l'Oumra et le Hajj au Sénégal. Forfaits complets, visa rapide, tontine halal.",
      },
      { name: "twitter:image", content: "https://saalimvoyage.com/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://saalimvoyage.com/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <Packages />
          <OumraSenegal />
          <Planning />
          <Services />
          <Places />
          <Guide />
          <Register />
          <Reviews />
          <Videos />
          <FAQ />
          <Payment />
          <Contact />
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}
