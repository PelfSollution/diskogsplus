import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";

export default async function callbackSpotify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const code = req.query.code as string;

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

      // Aquí tienes el token de acceso y el token de refresco. Puedes guardarlos como cookies o en una base de datos según tu preferencia.
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
      );

      res.redirect("/spotify");
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
