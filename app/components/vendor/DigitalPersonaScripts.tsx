// components/vendor/DigitalPersonaScripts.tsx
//
// Loads the DigitalPersona vendor SDK as a plain <script> tag rather than
// an ES import — see lib/digitalpersona/client.ts for why that distinction
// matters (the short version: it's a UMD bundle meant to attach itself to
// `window`, not something a bundler should try to resolve).
//
// Render this ONCE in your root layout (app/layout.tsx):
//
//   import { DigitalPersonaScripts } from "@/components/vendor/DigitalPersonaScripts";
//
//   export default function RootLayout({ children }: { children: React.ReactNode }) {
//     return (
//       <html lang="en">
//         <body>
//           <DigitalPersonaScripts />
//           {children}
//         </body>
//       </html>
//     );
//   }
//
// It expects the vendor file at /public/vendor/digitalpersona/websdk.client.ui.js
// — see the README section "Fixing the DigitalPersona bundler error" for how
// to get it there.
"use client";

import Script from "next/script";

export function DigitalPersonaScripts() {
  return (
    <Script
      src="/vendor/digitalpersona/websdk/dist/websdk.client.ui.js"
      strategy="beforeInteractive"
      onError={() =>
        console.error(
          "Failed to load the DigitalPersona vendor script. Confirm it exists at " +
            "/public/vendor/digitalpersona/websdk/dist/websdk.client.ui.js — see the README."
        )
      }
    />
  );
}
