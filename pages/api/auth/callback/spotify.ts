import { NextApiRequest, NextApiResponse } from "next";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { requireSessionUser } from "@/lib/session";
import { saveMixtapeURL } from "../../../../services/supabase/saveMixtapeURL";
import { generateMixtape, SpotifyApiError } from "../../../../services/spotify/getSpotifyMixtape";
import { getOwnedMixtapeName } from "../../../../services/supabase/mixtapes";

async function getSpotifyProfile(accessToken: string): Promise<string> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error("Error al obtener el perfil de Spotify");
  }
  
  const data = await response.json();
  return data.id;  // Retorna el nombre de usuario de Spotify
}


export default async function callbackSpotify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const expectedState = getCookie("spotifyOAuthState", { req, res });
    deleteCookie("spotifyOAuthState", { req, res });
    const mixtapeIdCookie = Number(getCookie("spotifyMixtapeId", { req, res }));
    deleteCookie("spotifyMixtapeId", { req, res });
    // Se vuelve a la mixtape (o a la lista) con el resultado en la query
    const backTo = (params: Record<string, string | number>) => {
      const base = Number.isInteger(mixtapeIdCookie) ? `/mixtape?id=${mixtapeIdCookie}&` : "/mixtapes?";
      res.redirect(`${base}${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`);
    };

    // El usuario canceló en Spotify
    if (req.query.error) {
      return backTo({ spotify_error: "cancelado" });
    }

    // Sin la cookie de estado: casi siempre, la app se abrió en otra dirección
    // (localhost) que la URL de retorno registrada en Spotify (127.0.0.1)
    if (!state || !expectedState || state !== expectedState) {
      return backTo({ spotify_error: "estado" });
    }

    // El usuario sale de la sesión, no del parámetro `state`
    const username = requireSessionUser(req, res);
    if (!username) return;

    if (!code) {
      res
        .status(400)
        .json({ error: "Código de autorización no proporcionado" });
      return;
    }

    const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET as string;
    const REDIRECT_URI = `${process.env.BASE_URL}/api/auth/callback/spotify`;

    const tokenData = new URLSearchParams();
    tokenData.append("grant_type", "authorization_code");
    tokenData.append("code", code);
    tokenData.append("redirect_uri", REDIRECT_URI);
    tokenData.append("client_id", CLIENT_ID);
    tokenData.append("client_secret", CLIENT_SECRET);

    try {
      const tokenResponse = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: tokenData,
      });

      const tokenResult = await tokenResponse.json();

      if (tokenResponse.status !== 200) {
        throw new Error(
          tokenResult.error_description ||
            "Error obteniendo el token de acceso de Spotify"
        );
      }

      const cookieOptions = {
        req,
        res,
        maxAge: tokenResult.expires_in, // Duración del token de acceso en segundos
        httpOnly: true,
      };

      setCookie("spotifyAccessToken", tokenResult.access_token, cookieOptions);
      setCookie(
        "spotifyRefreshToken",
        tokenResult.refresh_token,
        cookieOptions
       // secure: true  // Asegura que la cookie se envíe solo a través de conexiones HTTPS
      );

    
      // Obten el nombre de usuario del usuario autenticado
  
     // console.log('Nombre de usuario:', username); // <-- Agrega esta línea
      

      if (!username) {
        throw new Error("No se pudo obtener el nombre de usuario del usuario autenticado.");
      }

      const spotifyAccessToken = tokenResult.access_token;
      // Obtiene el nombre de usuario de Spotify
      const spotifyUsername = await getSpotifyProfile(spotifyAccessToken);

      // Mixtape elegida al autorizar (si sigue siendo del usuario); si no, todas las pistas
      const mixtapeName = Number.isInteger(mixtapeIdCookie)
        ? await getOwnedMixtapeName(username, mixtapeIdCookie)
        : null;
      const mixtape = mixtapeName ? { id: mixtapeIdCookie, nombre: mixtapeName } : undefined;

      const result = await generateMixtape(spotifyAccessToken, username, mixtape);
      await saveMixtapeURL(username, result.url, spotifyUsername);

      return backTo({ spotify: result.playlistId, exportadas: result.added, total: result.total });
    } catch (err: unknown) {
      console.error("Error en el callback de Spotify:", err);
      if (!res.writableEnded) {
        // 403: app en modo desarrollo sin el usuario en la lista o sin Premium
        const reason = err instanceof SpotifyApiError && err.status === 403 ? "permiso" : "error";
        backTo({ spotify_error: reason });
      }
    }
  } else {
    res.status(405).send("Método no permitido");
  }
}
