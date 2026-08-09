import type { Metadata, Viewport } from "next";
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { getAppSettings } from "@/lib/server/settings";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return {
    title: `${TRACKER_CONFIG.product.name} — ${settings.companyName}`,
    description: "A local-first project pipeline with deadlines, payment tracking, and configurable stages.",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFBF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1B29" },
  ],
};

/**
 * Applies a saved manual theme before first paint. Without this the page renders
 * in the OS theme and then snaps to the chosen one — a visible flash on every
 * navigation. It has to be inline and synchronous to beat the first paint.
 */
const themeBootstrap = `
(function(){
  try {
    var saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
