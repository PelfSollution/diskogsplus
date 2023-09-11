import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";
import { saveMixtapeURL } from "../../../../services/supabase/saveMixtapeURL";
import { generateMixtape } from "../../../../services/spotify/getSpotifyMixtape";

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
    const username = req.query.state as string;

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
  
      console.log('Nombre de usuario:', username); // <-- Agrega esta línea
      

      if (!username) {
        throw new Error("No se pudo obtener el nombre de usuario del usuario autenticado.");
      }

      const spotifyAccessToken = tokenResult.access_token;
      // Obtiene el nombre de usuario de Spotify
      const spotifyUsername = await getSpotifyProfile(spotifyAccessToken);

      // Generar mixtape con el token de acceso
      const embedUrl = await generateMixtape(
        spotifyAccessToken,
        username
    );

 
    await saveMixtapeURL(username, embedUrl, spotifyUsername);
    

      // Redirigir al usuario a la página que muestra la mixtape
      res.redirect(`/mixtapeplayer?embedUrl=${encodeURIComponent(embedUrl)}`);
    } catch (err: unknown) {
      if (!res.writableEnded) {
        res.status(500).json({
          error: "Error interno del servidor",
          detalles: (err as Error).message,
        });
      }
    }
  } else {
    res.status(405).send("Método no permitido");
  }
}
