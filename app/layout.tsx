import { DigitalPersonaScripts } from "@/app/components/vendor/DigitalPersonaScripts";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">
        <DigitalPersonaScripts />
        {children}
      </body>
    </html>
  );
}