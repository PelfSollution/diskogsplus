import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import addWantlistEntry, {
  WantlistEntry,
} from "@/services/supabase/addWantlistEntry";
var Discogs = require("disconnect").Client;
var CryptoJS = require("crypto-js");

interface DiscogsRelease {
  id: number;
  resource_url: string;
  date_added: string;
  rating: number;
  notes: string;
  basic_information: {
    id: number;
    title: string;
    artists: { name: string }[];
    thumb: string;
  };
}

export default async function importWantlistFromDiscogs(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { username } = req.body;

    const accessDatacipherObj = getCookie("accessData", { req, res });

    const bytes = CryptoJS.AES.decrypt(
      accessDatacipherObj,
      process.env.CRYPT_KEY
    );
    const accessData = await JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const userClient = new Discogs(accessData).user();

    const userWantlist = await userClient.wantlist().getReleases(username);

    if (
      !userWantlist ||
      !userWantlist.wants ||
      !Array.isArray(userWantlist.wants)
    ) {
      res.status(400).json({
        error_code: "no_valid_releases",
        message: "Respuesta de Discogs no contiene releases válidos.",
      });
      return;
    }

    const formattedEntries: WantlistEntry[] = userWantlist.wants.map(
      (release: DiscogsRelease) => {
        const basicInfo = release.basic_information;

        return {
          username: username,
          disco_id: release.id,
          notes: release.notes || "Sin notas",
          rating: release.rating || 0,
          artista: basicInfo.artists[0].name,
          album: basicInfo.title,
          image_url: basicInfo.thumb || "/no-portada.gif",
        };
      }
    );

    for (let entry of formattedEntries) {
      await addWantlistEntry(entry);
    }

    res.send({ success: true, message: "Wantlist importada exitosamente." });
  } catch (err: any) {
    console.error("Error al importar wantlist:", err);
    res.status(400).json({
      error_code: "wantlist_import",
      message: err.message,
    });
  }
}
