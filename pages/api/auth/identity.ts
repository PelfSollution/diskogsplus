var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import { decryptCookieJSON, getSessionUser } from "@/lib/session";

/** Perfil mínimo a partir de la sesión, cuando no se puede consultar Discogs. */
function sessionProfile(username: string) {
  return {
    username,
    num_collection: 0,
    avatar_url: "",
    registered: "",
  };
}

export default async function identity(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = getSessionUser(req, res);
  const accessData = decryptCookieJSON<any>(getCookie("accessData", { req, res }));

  // Sin sesión: perfil vacío
  if (!username || !accessData) {
    return res.send({ userProfile: {} });
  }

  // Sesión de desarrollo (devLogin): tokens falsos, Discogs no reconoce al usuario
  if (typeof accessData.token === "string" && accessData.token.startsWith("dev_")) {
    return res.send({ userProfile: sessionProfile(username), offline: true });
  }

  try {
    // Conectar con Discogs y obtener el perfil de usuario
    var dis = new Discogs(accessData);
    const userProfile = await dis.user().getProfile(username);
    if (userProfile) {
      return res.send({ userProfile });
    }
  } catch (err: any) {
    console.warn("[Identity] No se pudo obtener el perfil de Discogs:", err?.statusCode, err?.message);
  }

  // Discogs no disponible o tokens caducados: la sesión sigue siendo válida
  return res.send({ userProfile: sessionProfile(username), offline: true });
}
