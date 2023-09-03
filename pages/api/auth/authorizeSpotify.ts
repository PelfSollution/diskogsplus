import { NextApiRequest, NextApiResponse } from 'next';


export default async function authorizeSpotify(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
        const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = `${process.env.BASE_URL}/api/auth/callback/spotify`;  // Asegúrate de configurar el callback en tu Dashboard de Spotify
        const SCOPES = 'playlist-modify-public';  // Ajusta los scopes según tus necesidades

        const authURL = `${SPOTIFY_AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;
        console.log(authURL);
        // Redirige al usuario al URL de autorización de Spotify
        res.redirect(authURL);
    } else {
        res.status(405).send('Método no permitido');
    }
}

