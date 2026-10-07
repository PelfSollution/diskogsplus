import { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { setCookie } from "cookies-next";
import { requireSessionUser } from "@/lib/session";

export default async function authorizeSpotify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const username = requireSessionUser(req, res);
    if (!username) return;

    // `state` aleatorio contra CSRF: se valida en el callback contra la cookie
    const state = randomBytes(16).toString("hex");
    setCookie("spotifyOAuthState", state, {
      req,
      res,
      maxAge: 60 * 10,
      httpOnly: true,
      sameSite: "lax",
    });

    const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID || "",
      response_type: "code",
      redirect_uri: `${process.env.BASE_URL}/api/auth/callback/spotify`,
      scope: "playlist-modify-public",
      state,
    });

    res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
  } else {
    res.status(405).send("Método no permitido");
  }
}
