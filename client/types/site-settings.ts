export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImageUrl: string;
  canonicalUrl: string;
  whatsappNumber: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "LMS Studio",
  tagline: "Premium Enterprise Learning Platform",
  logoLightUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  metaTitle: "LMS Studio — Premium Enterprise Learning Platform",
  metaDescription:
    "Learn Next.js 14, AI Engineering, Cybersecurity & Mobile Development with live hands-on projects and certified masterclasses.",
  metaKeywords: [
    "LMS Studio",
    "Online Courses",
    "Programming Masterclass",
    "Next.js 14",
    "Fullstack Architecture",
    "AI Engineering",
    "Certified Learning",
  ],
  ogImageUrl: "",
  canonicalUrl: "http://localhost:3001",
  whatsappNumber: "",
};
