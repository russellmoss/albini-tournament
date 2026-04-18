import type { Metadata } from "next";
import { Slideshow } from "@/components/Slideshow";
import { listPublicCovers } from "@/lib/covers";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Inaugural Albini Invitational",
  description: "Juergens Memorial Caroms Tournament",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const covers = await listPublicCovers();

  return (
    <html lang="en">
      <body className="relative min-h-screen">
        {covers.length > 0 && <Slideshow images={covers} />}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-[var(--overlay)] pointer-events-none"
        />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}
