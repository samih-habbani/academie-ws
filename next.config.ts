import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Les images sont servies telles quelles depuis /public (sans passer par /_next/image).
    // Le quota d'optimisation d'images du plan Vercel Hobby étant épuisé, l'optimiseur
    // répondait 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) et les images disparaissaient.
    // Le lazy loading de <Image> reste actif. Pour réactiver l'optimisation : retirer cette
    // ligne (et définir formats / deviceSizes / qualities / minimumCacheTTL) une fois le quota
    // restauré ou le plan changé.
    unoptimized: true,
  },
};

export default nextConfig;
