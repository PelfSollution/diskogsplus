import { NextApiRequest, NextApiResponse } from 'next';
var Discogs = require('disconnect').Client;

// Esta función obtiene datos de álbumes.
export default async function AlbumData(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Obtengo la página y el número de entradas por página de la consulta.
    const { page, per_page } = req.query;

    // Me conecto a Discogs con mis credenciales.
    const dis = new Discogs({
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
    });

    // Estoy asumiendo que quiero recuperar los lanzamientos recientes. 
    // Podría modificar esta función según mis necesidades específicas en el futuro.
    const albumData = await dis.database().getRecentReleases({
      page: page,
      per_page: per_page,
    });

    // Envío los datos del álbum como respuesta.
    res.json(albumData);
  } catch (err) {
    // Si ocurre algún error, respondo con un código 500 y envío el error.
    res.status(500).send(err);
  }
}

