import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF d'abord (≈20 % plus léger que WebP), WebP en repli, format d'origine sinon.
    formats: ["image/avif", "image/webp"],
    // Largeurs d'écran mobile-first : 360 couvre les petits téléphones, 1920 le desktop.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1280, 1920],
    // Petites images (logos de catégories 28px, vignette d'en-tête 160px) — toutes < 360.
    imageSizes: [32, 64, 128, 160, 256, 320],
    // Qualités réellement utilisées dans le code (obligatoire depuis Next 16) :
    // 70 = vignettes de cours/thèmes/logos, 75 = photo de profil.
    qualities: [70, 75],
    // 31 jours. Sur Vercel Hobby, chaque cache MISS *et* STALE compte comme une
    // transformation (quota 5 000/mois) : un TTL court re-transformerait les images
    // en boucle. Contrepartie : si tu remplaces une image, change aussi son nom de fichier.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
