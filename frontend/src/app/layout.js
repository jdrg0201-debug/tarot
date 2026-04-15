import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

import MysticAtmosphere from "@/components/common/MysticAtmosphere";

export const metadata = {
  title: "Experiencia Mística - Tarot Premium",
  description: "Conexión energética directa con el maestro",
};

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-cosmic text-white min-h-screen text-foreground overflow-x-hidden`}>
        <MysticAtmosphere />
        {children}
      </body>
    </html>
  );
}
