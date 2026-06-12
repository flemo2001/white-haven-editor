// WHC fork layout — 2026-06-12. Stripped upstream's botid bot-protection +
// databuddy analytics + changelog notification (none relevant to internal
// tool). Forces dark theme since WHC review is dark-only.
//
// Font set: Inter for site UI + 11 additional Google Fonts loaded via
// next/font/google for the IG-style preset picker. next/font self-hosts
// the woff2 files at build time (no runtime CDN call), exposing each
// family via a CSS custom property the ig-styles config consumes.
// Anton is intentionally referenced by two preset rows (Meme + Poster) —
// one download, two treatments. See src/fonts/ig-styles.ts.
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { baseMetaData } from "./metadata";
import {
  Inter,
  Montserrat,
  Pacifico,
  Courier_Prime,
  Archivo_Black,
  Anton,
  Playfair_Display,
  Oswald,
  Lora,
  Dancing_Script,
  DM_Serif_Display,
  Fredoka,
  Bebas_Neue,
  Poiret_One,
} from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600"], variable: "--font-montserrat" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: "400", variable: "--font-courier-prime" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo-black" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], variable: "--font-playfair" });
const oswald = Oswald({ subsets: ["latin"], weight: ["600"], variable: "--font-oswald" });
const lora = Lora({ subsets: ["latin"], weight: ["400"], variable: "--font-lora" });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600"], variable: "--font-dancing-script" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif" });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500"], variable: "--font-fredoka" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
const poiret = Poiret_One({ subsets: ["latin"], weight: "400", variable: "--font-poiret" });

// Compose the CSS-variable className that exposes every font to the rest
// of the app. Used in :root via the body element below; the ig-styles
// config references each via `var(--font-xxx)`.
const fontVariables = [
  inter.variable,
  montserrat.variable,
  pacifico.variable,
  courierPrime.variable,
  archivoBlack.variable,
  anton.variable,
  playfair.variable,
  oswald.variable,
  lora.variable,
  dancingScript.variable,
  dmSerif.variable,
  fredoka.variable,
  bebas.variable,
  poiret.variable,
].join(" ");

export const metadata = baseMetaData;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={true}
        >
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
