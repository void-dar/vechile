// components/vendor/DigitalPersonaScripts.tsx
//
// Loads ONLY the DigitalPersona transport script as a plain <script> tag —
// see lib/digitalpersona/client.ts for the full explanation, short version:
// @digitalpersona/websdk ships as IIFE/UMD only (no ESM/CJS build exists),
// so it can't be `import`ed by a bundler no matter how it's configured.
// It defines window.WebSdkCore, which @digitalpersona/devices' typed
// FingerprintReader (imported normally in client.ts) relies on internally.
//
// @digitalpersona/fingerprint is NOT loaded here and is not a dependency of
// this project — @digitalpersona/devices supersedes it with a real,
// importable API, so there's no reason to touch the raw window.Fingerprint
// global at all.
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
// Expects the vendor file at /public/vendor/digitalpersona/websdk.client.ui.js
// — see the README section "Fixing the DigitalPersona bundler error."
"use client";

import Script from "next/script";

export function DigitalPersonaScripts() {
  return (
    <Script
      src="/vendor/digitalpersona/websdk/dist/websdk.client.ui.js"
      strategy="afterInteractive"
      onError={() =>
        console.error(
          "Failed to load websdk.client.ui.js. Confirm it exists at " +
            "/public/vendor/digitalpersona/websdk/dist/websdk.client.ui.js — see the README."
        )
      }
    />
  );
}
