import type { Metadata } from "next";
// Fonts are self-hosted (no request to Google), so they load fast and offline.
// Anek Bangla: the whole UI, Bangla and Latin. Noto Serif Bengali: the formal letter.
import "@fontsource-variable/anek-bangla/wdth.css";
import "@fontsource/noto-serif-bengali/400.css";
import "@fontsource/noto-serif-bengali/600.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ovijog: get your money back",
  description:
    "Cheated by a shop, an online seller or a service in Bangladesh? Ovijog writes the message to send the seller and a formal consumer complaint under the Consumers' Right Protection Act, 2009.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
