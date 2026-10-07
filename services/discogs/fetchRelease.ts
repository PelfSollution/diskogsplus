var Discogs = require("disconnect").Client;

/**
 * Obtiene un release de Discogs: primero con OAuth (si hay accessData real) y
 * después con la API pública, con reintentos ante claves inválidas o timeouts.
 */
export async function fetchDiscogsRelease(releaseId: string | number, accessData: any) {
  // Validar releaseId
  if (!releaseId || releaseId === "NaN" || releaseId === "undefined" || releaseId === "0") {
    throw new Error("ID de vinilo inválido");
  }

  // 1. Intentar con OAuth si accessData es válido y no es de desarrollo
  if (accessData && accessData.token && !accessData.token.startsWith("dev_")) {
    try {
      const db = new Discogs(accessData).database();
      const data = await db.getRelease(releaseId);
      if (data && data.title) return data;
    } catch (e: any) {
      console.warn("[Discogs] Fallo con accessData de Discogs, recurriendo a API pública:", e?.message);
    }
  }

  // 2. Consulta a la API pública de Discogs con fallback resiliente
  const baseHeaders: Record<string, string> = {
    "User-Agent": "DiskogsPlus/2.0 (musical-agent-assistant; +https://diskogsplus.local)",
    "Accept": "application/json",
  };

  const key = process.env.CONSUMER_KEY?.trim();
  const secret = process.env.CONSUMER_SECRET?.trim();
  const headersWithAuth: Record<string, string> = { ...baseHeaders };

  if (key && secret) {
    headersWithAuth.Authorization = `Discogs key=${key}, secret=${secret}`;
  }

  // Intento 1: con Authorization si existe
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
      headers: headersWithAuth,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Si devuelve 200, retornamos directamente
    if (res.ok) {
      return await res.json();
    }

    // Si devuelve 401 o 403 (claves inválidas/expiradas), reintentar sin Authorization
    if ((res.status === 401 || res.status === 403) && headersWithAuth.Authorization) {
      console.warn(`[Discogs] Error ${res.status} con Authorization header. Reintentando consulta pública...`);
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 8000);

      const retryRes = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
        headers: baseHeaders,
        signal: retryController.signal,
      });
      clearTimeout(retryTimeout);

      if (retryRes.ok) {
        return await retryRes.json();
      }
      throw new Error(`Discogs API pública respondió con status ${retryRes.status}: ${retryRes.statusText}`);
    }

    throw new Error(`Discogs API respondió con status ${res.status}: ${res.statusText}`);
  } catch (err: any) {
    // Si fue error de abort/timeout o red con headersWithAuth, intentar una última vez puramente pública
    if (headersWithAuth.Authorization) {
      try {
        console.warn("[Discogs] Falló primer intento con credenciales, probando API pública limpia...");
        const cleanRes = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
          headers: baseHeaders,
        });
        if (cleanRes.ok) return await cleanRes.json();
      } catch (cleanErr: any) {
        console.error("[Discogs] Falló también la consulta pública limpia:", cleanErr?.message);
      }
    }
    throw err;
  }
}
