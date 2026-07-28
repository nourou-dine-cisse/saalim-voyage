import { createFileRoute } from "@tanstack/react-router";
import { LangProvider } from "@/i18n/LangContext";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Packages } from "@/components/sections/Packages";
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
      { title: "Saalim Voyages — Omra & Hajj depuis Dakar, Sénégal" },
      { name: "description", content: "Agence Saalim Voyages : forfaits Omra et Hajj, visa, billets, tontine halal. Accompagnement spirituel des pèlerins du Sénégal, d'Afrique, d'Europe et du monde." },
      { property: "og:title", content: "Saalim Voyages — Omra & Hajj" },
      { property: "og:description", content: "Votre voyage sacré, accompagné avec sérénité. Forfaits, visa, tontine halal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
