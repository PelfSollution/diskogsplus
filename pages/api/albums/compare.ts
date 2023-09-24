var Discogs = require("disconnect").Client;
import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
var CryptoJS = require("crypto-js");

interface Album {
  basic_information: {
    formats: { name: string }[];
  };
  id: number;
}

async function getVinylCollection(
  username: string,
  accessData: any,
  page: number,
  per_page: number
) {
  var dis = new Discogs(accessData);
  let currentPage = 1;
  let totalPages = 1;
  let allReleases: Album[] = [];

  while (currentPage <= totalPages) {
    const userCollection = await dis
    .user()
    .collection()
    .getReleases(username, 0, {
      page: currentPage, // Utiliza currentPage en lugar de page
      per_page: per_page,
      sort: "artist",
      sort_order: "asc",
    });
  

    totalPages = userCollection.pagination.pages;

    allReleases = allReleases.concat(userCollection.releases);

    currentPage++;
  }

  return allReleases;
}

export default async function compare(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { user1, user2, page, per_page } = req.query;

    if (typeof user1 !== "string" || typeof user2 !== "string") {
      res
        .status(400)
        .send({ error: "Los nombres de usuario deben ser cadenas válidas" });
      return;
    }

    const accessDataObj = getCookie("accessData", { req, res });

    if (!accessDataObj) {
      res.status(400).send({ error: "Faltan datos de acceso" });
      return;
    }

    const accessBytes = await CryptoJS.AES.decrypt(
      accessDataObj,
      process.env.CRYPT_KEY
    );
    const accessData = await JSON.parse(
      accessBytes.toString(CryptoJS.enc.Utf8)
    );

    const collection1 = await getVinylCollection(
      user1,
      accessData,
      Number(page),
      Number(per_page)
    );
    const collection2 = await getVinylCollection(
      user2,
      accessData,
      Number(page),
      Number(per_page)
    );

    const diff = collection1.filter(
      (album1: Album) =>
        !collection2.some((album2: Album) => album2.id === album1.id)
    );

    res.send(diff);
  } catch (err) {
    res.status(500).send(err);
  }
}
