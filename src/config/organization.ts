/**
 * Single source of truth for Visualia's entity data (Organization schema).
 * Used by the /nosotros page and mirrored in index.html for crawlers without JS.
 */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Visualia",
  alternateName: "Visualia Media",
  legalName: "Boga Casa de Contenidos S.A.S.",
  url: "https://visualiamedia.com",
  logo: {
    "@type": "ImageObject",
    url: "https://visualiamedia.com/favicon.png",
    width: 1080,
    height: 1080,
  },
  image: "https://visualiamedia.com/og-image.png",
  description:
    "Plataforma colombiana de menús digitales y señalización digital para restaurantes y negocios físicos.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bogotá",
    addressRegion: "Bogotá D.C.",
    addressCountry: "CO",
  },
  taxID: "900.325.011-10",
  areaServed: "CO",
  knowsAbout: [
    "menús digitales",
    "señalización digital",
    "cartelería digital para restaurantes",
  ],
  sameAs: [
    "https://www.linkedin.com/company/visualiamedia",
    "https://www.instagram.com/visualiamedia",
    "https://www.facebook.com/visualiamedia",
    "https://www.youtube.com/@visualiamedia",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hola@visualiamedia.com",
      telephone: "+57 316 326 5696",
      areaServed: "CO",
      availableLanguage: ["Spanish"],
    },
  ],
} as const;
