// next.config.mjs
//
// .mjs, not .ts — next.config.ts hit "exports is not defined in ES module
// scope" on this project: Next's TS-config compiler was producing
// CommonJS output, then executing it under Node's ESM loader (which this
// "type": "module" project uses for all .js/.mjs files). That's a mismatch
// inside Next's own config loader, not in anything this file does — the
// .ts version had identical, valid ESM syntax and still failed. .mjs
// skips Next's TS compilation step entirely: Node loads it natively as
// ESM, no transpilation in between to go wrong.
//
// IMPORTANT: this config only takes effect under webpack, not Turbopack.
// Next.js 16 defaults to Turbopack — run with `--webpack` (see package.json
// scripts) or this file's effects are silently skipped.
//
// Two mechanisms for DigitalPersona's bare-specifier imports (see
// lib/digitalpersona/shims/websdk-shim.ts for the fuller story):
//
// 1. resolve.alias — the primary fix. Points the literal string 'WebSdk'
//    at a real local file — a plain string-to-file rule that doesn't
//    depend on webpack's externals global-substitution behavior, which
//    failed to catch this same import when tried first.
// 2. externals — kept as a secondary safety net for a couple of OTHER bare
//    names (BigInteger, sjcl, async, SRPClient) from @digitalpersona/websdk's
//    UMD bundle. That file is loaded via a <script> tag now, not imported,
//    so these shouldn't currently trigger — left mapped in case something
//    in the dependency tree imports it directly after all.

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      WebSdk: path.resolve(__dirname, "app/lib/digitalpersona/shims/websdk-shim.ts"),
    };

    if (!isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        {
          "@digitalpersona/websdk": "WebSdkCore",
          async: "async",
          sjcl: "sjcl",
          BigInteger: "BigInteger",
          SRPClient: "SRPClient",
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
