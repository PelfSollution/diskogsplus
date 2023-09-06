import { NextApiRequest, NextApiResponse } from "next";

export default async function authorizeSpotify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = `${process.env.BASE_URL}/api/auth/callback/spotify`;
    const SCOPES = "playlist-modify-public";
    const authURL = `${SPOTIFY_AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;

    res.redirect(authURL);
  } else {
    res.status(405).send("Método no permitido");
  }
}
