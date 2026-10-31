import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://saalimvoyage.com/#agency",
  name: "Saalim Voyages",
  alternateName: [
    "Saalim Voyage",
    "Agence Saalim Voyages",
    "Oumra Sénégal Saalim Voyages",
    "Saalim Voyages Dakar",
  ],
  url: "https://saalimvoyage.com/",
  logo: "https://saalimvoyage.com/logo.jpeg",
  image: "https://saalimvoyage.com/og-image.jpg",
  description:
    "Agence de voyage agréée au Sénégal spécialisée dans l'Oumra et le Hajj au départ de Dakar. Forfaits tout compris, visas, billets d'avion, hôtels proches du Haram et tontine sans riba.",
  telephone: "+221789922020",
  email: "saalimvoyages@gmail.com",
  priceRange: "$$",
  currenciesAccepted: "XOF, EUR, USD",
  paymentAccepted: "Wave, Orange Money, Virement bancaire, Espèces",
  address: [
    {
      "@type": "PostalAddress",
      streetAddress: "Sacré-Cœur 3",
      addressLocality: "Dakar",
      addressRegion: "Dakar",
      addressCountry: "SN",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "Médina Baye",
      addressLocality: "Kaolack",
      addressRegion: "Kaolack",
      addressCountry: "SN",
    },
  ],
  geo: {
    "@type": "GeoCoordinates",
    latitude: "14.7167",
    longitude: "-17.4677",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "08:00",
      closes: "20:00",
    },
  ],
  areaServed: [
    { "@type": "Country", name: "Sénégal" },
    { "@type": "Country", name: "France" },
    { "@type": "AdministrativeArea", name: "Afrique de l'Ouest" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Forfaits Oumra et Hajj au Sénégal",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Forfait Oumra Sénégal (Économique, Confort, Premium)",
          description:
            "Voyage complet pour l'Oumra au départ de Dakar avec vols, hôtels proches du Haram, visa et guide religieux.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Forfait Hajj Sénégal",
          description:
            "Accompagnement complet pour le grand pèlerinage Hajj à La Mecque et Médine.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Tontine Oumra Sénégal (sans riba)",
          description:
            "Système d'épargne solidaire mensuelle 100% halal pour financer son pèlerinage au Sénégal.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Demande de Visa Omra et Billetterie",
          description:
            "Délivrance rapide du visa saoudien et réservation de billets d'avion Dakar-Jeddah / Médine.",
        },
      },
    ],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment faire une Oumra depuis le Sénégal avec Saalim Voyages ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pour réaliser votre Oumra depuis le Sénégal, inscrivez-vous en ligne sur saalimvoyage.com ou contactez notre agence à Dakar au +221 78 992 20 20. Saalim Voyages s'occupe de toutes les formalités : visa saoudien, billets d'avion au départ de Dakar (AIBD), réservation d'hôtels proches du Haram à La Mecque et Médine, transferts et accompagnement spirituel avec des guides sénégalais.",
      },
    },
    {
      "@type": "Question",
      name: "Quel est le prix d'un forfait Oumra au départ de Dakar, Sénégal ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les prix des forfaits Oumra au Sénégal varient selon le niveau de confort choisi (Économique, Confort ou Premium) et la période (notamment durant le mois béni de Ramadan). Saalim Voyages propose des tarifs très compétitifs avec des facilités de paiement échelonné et la Tontine Oumra sans aucun intérêt (riba).",
      },
    },
    {
      "@type": "Question",
      name: "Quels sont les documents nécessaires pour le visa Oumra pour les Sénégalais ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pour obtenir le visa Oumra depuis le Sénégal, il faut un passeport biométrique valide au moins 6 mois après la date de retour prévue, une photo d'identité récente sur fond blanc, ainsi que les documents requis par le ministère saoudien. Notre agence prend en charge l'intégralité du traitement de votre demande de visa.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionne la Tontine Oumra sans Riba au Sénégal ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La Tontine Oumra de Saalim Voyages est une solution d'épargne mensuelle solidaire et 100% conforme à la finance islamique (sans aucun intérêt). Elle permet à chaque pèlerin sénégalais d'anticiper et de financer progressivement son voyage sacré sans pression financière.",
      },
    },
    {
      "@type": "Question",
      name: "Quels sont les moyens de paiement acceptés pour l'Oumra au Sénégal ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nous acceptons les paiements via Wave (code marchand), Orange Money, virement bancaire et en espèces directement à nos agences de Dakar (Sacré-Cœur 3) et Kaolack (Médina Baye).",
      },
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://saalimvoyage.com/#website",
  url: "https://saalimvoyage.com/",
  name: "Saalim Voyages — Oumra Sénégal & Hajj",
  description:
    "Agence agréée au Sénégal : forfaits Oumra et Hajj depuis Dakar, visas, billets et tontine sans riba.",
  inLanguage: "fr-SN",
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Oumra Sénégal — Saalim Voyages | Agence Hajj & Omra Dakar" },
      {
        name: "description",
        content:
          "Agence Saalim Voyages au Sénégal : spécialiste de l'Oumra et du Hajj depuis Dakar. Forfaits Oumra tout compris, visas, billets d'avion, tontine halal sans riba, hôtels proches du Haram à La Mecque et Médine.",
      },
      {
        name: "keywords",
        content:
          "oumra senegal, omra senegal, agence oumra dakar, hajj senegal, forfait oumra senegal, prix oumra senegal, voyage la mecque senegal, tontine oumra, visa omra senegal, saalim voyages, saalimvoyage.com",
      },
      { name: "author", content: "Saalim Voyages" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow" },
      { name: "geo.region", content: "SN-DK" },
      { name: "geo.placename", content: "Dakar, Sénégal" },
      { name: "geo.position", content: "14.7167;-17.4677" },
      { name: "ICBM", content: "14.7167, -17.4677" },
      { property: "og:site_name", content: "Saalim Voyages" },
      { property: "og:title", content: "Oumra Sénégal — Saalim Voyages | Agence Omra & Hajj Dakar" },
      {
        property: "og:description",
        content:
          "Partez en Oumra depuis le Sénégal en toute sérénité avec Saalim Voyages. Forfaits tout compris, guides spirituels, hôtels à La Mecque et Médine, tontine sans riba.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://saalimvoyage.com/" },
      { property: "og:locale", content: "fr_SN" },
      { property: "og:locale:alternate", content: "fr_FR" },
      { property: "og:image", content: "https://saalimvoyage.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Oumra Sénégal - Agence Saalim Voyages Dakar" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Oumra Sénégal — Saalim Voyages | Agence Omra & Hajj Dakar" },
      {
        name: "twitter:description",
        content:
          "Agence agréée au Sénégal : forfaits Oumra et Hajj depuis Dakar, visas, hôtels La Mecque et Médine, tontine halal.",
      },
      { name: "twitter:image", content: "https://saalimvoyage.com/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://saalimvoyage.com/" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/logo.jpeg" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
