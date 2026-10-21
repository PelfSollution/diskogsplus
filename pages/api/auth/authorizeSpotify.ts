import { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { deleteCookie, setCookie } from "cookies-next";
import { requireSessionUser } from "@/lib/session";
import { getOwnedMixtapeName } from "@/services/supabase/mixtapes";

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

    // Mixtape que se exporta (?mixtape_id=); el callback la vuelve a comprobar
    const mixtapeId = Number(req.query.mixtape_id);
    if (Number.isInteger(mixtapeId)) {
      if (!(await getOwnedMixtapeName(username, mixtapeId))) {
        res.status(404).json({ error: "Mixtape no encontrada" });
        return;
      }
      setCookie("spotifyMixtapeId", String(mixtapeId), {
        req,
        res,
        maxAge: 60 * 10,
        httpOnly: true,
        sameSite: "lax",
      });
    } else {
      deleteCookie("spotifyMixtapeId", { req, res });
    }

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
