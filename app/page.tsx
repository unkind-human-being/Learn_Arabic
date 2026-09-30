import type { Metadata, Viewport } from "next";
import LearnArabicGame from "./level-one/LearnArabicGame";
import "./pwa/pwa-global.css";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Wear to Madrasa | Learn Arabic",
  description: "A gentle Arabic word-building game for children. Basic Level 1: Wear to Madrasa.",
  applicationName: "Learn Arabic",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Learn Arabic", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#21745b", colorScheme: "light",
};
export default function Home() { return <LearnArabicGame />; }
