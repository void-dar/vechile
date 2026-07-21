/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/digitalpersona/shims/websdk-shim.ts
//
// Satisfies `import 'WebSdk';` inside @digitalpersona/devices' internals
// (node_modules/@digitalpersona/devices/dist/es5/devices/websdk/channel.js
// and anywhere else in that package that does the same bare import).
//
// That import has no bindings pulled from it anywhere we've seen — it's
// side-effect-only — so this shim just re-exports whatever the vendor
// <script> tag actually attached to window (window.WebSdkCore, confirmed
// via devtools) and nothing more is needed.
//
// This is aliased in via next.config.ts's `resolve.alias`, NOT via
// `externals` — externals failed to catch this bare specifier twice in a
// row (still unclear exactly why under this project's webpack setup), so
// resolve.alias is used instead: a plain "when you see this import string,
// resolve to this real file" rule, which doesn't depend on webpack's
// external-type/global-variable substitution working as expected.
//
// .ts, not .js with module.exports — the project's package.json has
// "type": "module", so a CommonJS module.exports here would hit the same
// exports-in-ESM-scope mismatch that broke next.config.ts.
export default typeof window !== "undefined" ? (window as any).WebSdkCore : undefined;
