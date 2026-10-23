import type { Metadata } from "next";
import "@fontsource-variable/figtree";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: BRAND.name, description: BRAND.tagline };

const themeScript = `try{var t=localStorage.getItem("mixeropx-theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
