import type { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

/**
 * Descifra un valor de cookie cifrado con AES (CRYPT_KEY) que contiene JSON.
 * Devuelve null si falta la clave, la cookie o el contenido no es válido.
 */
export function decryptCookieJSON<T = unknown>(cipher: unknown): T | null {
  const key = process.env.CRYPT_KEY;
  if (!key || typeof cipher !== "string" || !cipher) return null;

  try {
    let value = cipher;
    try {
      value = decodeURIComponent(cipher);
    } catch {
      // ya estaba decodificado
    }
    const bytes = CryptoJS.AES.decrypt(value, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado a partir de la cookie httpOnly `usernameCipher`.
 * Es la única fuente fiable de identidad: nunca usar el `username` del body o la query.
 */
export function getSessionUser(
  req: NextApiRequest,
  res: NextApiResponse
): string | null {
  const username = decryptCookieJSON<string>(
    getCookie("usernameCipher", { req, res })
  );
  return typeof username === "string" && username ? username : null;
}

/** Variante para route handlers del App Router. */
export function getSessionUserFromCookie(
  usernameCipher: string | undefined
): string | null {
  const username = decryptCookieJSON<string>(usernameCipher);
  return typeof username === "string" && username ? username : null;
}

/**
 * Exige sesión en una ruta del Pages Router. Si no hay sesión responde 401
 * y devuelve null.
 */
export function requireSessionUser(
  req: NextApiRequest,
  res: NextApiResponse
): string | null {
  const username = getSessionUser(req, res);
  if (!username) {
    res.status(401).json({ error: "No autenticado. Inicia sesión de nuevo." });
    return null;
  }
  return username;
}
