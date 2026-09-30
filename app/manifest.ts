import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Learn Arabic — Wear to Madrasa", short_name: "Learn Arabic",
    description: "Build Arabic words, discover beautiful habits, and play Level 1 offline after a complete first download.",
    lang: "en", dir: "ltr", start_url: "/", scope: "/",
    display: "standalone", orientation: "landscape",
    background_color: "#f7f9f3", theme_color: "#21745b",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
