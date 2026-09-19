import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/footer/Footer";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { AuthProvider } from "@/components/auth/auth-provider";
import { verifyJwt } from "@/lib/jwt";

export const metadata: Metadata = {
  title: "CSCP GeoEpi | Consumer Safety & Geo-Epidemiological Intelligence",
  description:
    "Smart Map, Geo-Epidemiology & Intelligent Inspection Planning Platform for District Consumer Protection",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cscp_session")?.value;
  let userSession = null;
  
  if (token) {
    userSession = await verifyJwt(token);
  }

  return (
    <html lang="th">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://api.longdo.com/map/?key=ad6d7ca9219f8ed0c10600426d4bff02"
          async
        ></script>
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
        <AuthProvider user={userSession}>
          <Header />
          <main className="flex-1 flex flex-col pb-[68px] md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
