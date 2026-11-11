// "Pasar ajustes a otro dispositivo": codifica/decodifica/valida la configuración de IA (proveedor, API key, modelo)
// para llevarla en el FRAGMENTO de un enlace (#cfg=<base64url de JSON>). Puro, sin DOM. Nunca va en query string.
export const CFG_VERSION = 1;
export const PROVIDERS = ["anthropic", "gemini"];
export const PROVIDER_NAMES = { anthropic: "Anthropic (Claude)", gemini: "Google (Gemini)" };
const B64U = /^[A-Za-z0-9_-]+$/;
const MAX_TOKEN = 2000;

function toB64u(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64u(tok) {
  const b64 = tok.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((tok.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Valida y normaliza { provider, apiKey, model }. → { ok, cfg } | { ok:false, error } */
export function validateCfg(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return { ok: false, error: "Datos inválidos." };
  const provider = o.provider;
  if (!PROVIDERS.includes(provider)) return { ok: false, error: "Proveedor desconocido." };
  const apiKey = typeof o.apiKey === "string" ? o.apiKey.trim() : "";
  if (!/^[\x21-\x7e]{8,300}$/.test(apiKey)) return { ok: false, error: "La API key no tiene un formato válido." };
  const model = o.model === undefined || o.model === null ? "" : o.model;
  if (typeof model !== "string" || !/^[\w.:/\-]{0,100}$/.test(model)) return { ok: false, error: "El modelo no tiene un formato válido." };
  return { ok: true, cfg: { provider, apiKey, model } };
}

/** → token base64url. Sólo viajan proveedor, key y modelo (cualquier otro campo se descarta). */
export function encodeCfg(cfg) {
  const v = validateCfg(cfg);
  if (!v.ok) throw new Error(v.error);
  const { provider, apiKey, model } = v.cfg;
  return toB64u(JSON.stringify({ v: CFG_VERSION, provider, apiKey, model }));
}

/** token → { ok:true, cfg } | { ok:false, error }. Ignora campos extra; rechaza versión desconocida o datos corruptos. */
export function decodeCfg(token) {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN || !B64U.test(token)) return { ok: false, error: "El código no es válido." };
  let obj;
  try { obj = JSON.parse(fromB64u(token)); } catch (e) { return { ok: false, error: "El código está dañado." }; }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false, error: "El código está dañado." };
  if (obj.v !== CFG_VERSION) return { ok: false, error: "El código es de otra versión de la app." };
  return validateCfg(obj);
}

/** Enlace a la propia app con los ajustes en el fragmento. */
export function buildShareUrl(origin, pathname, cfg) {
  return `${origin}${pathname}#cfg=${encodeCfg(cfg)}`;
}

/** Saca el token de un enlace, de un fragmento ("#cfg=…") o de un texto que lo contenga. null si no hay. */
export function extractToken(text) {
  const s = String(text || "").trim();
  const i = s.indexOf("#cfg=");
  if (i < 0) return B64U.test(s) && s.length >= 24 ? s : null;
  const m = /^[A-Za-z0-9_-]+/.exec(s.slice(i + 5));
  return m ? m[0] : null;
}

/** "sk-ant-abc123wxyz" → "••••wxyz" */
export function maskKey(key) {
  const k = String(key || "");
  return k.length > 8 ? "••••" + k.slice(-4) : "••••";
}
