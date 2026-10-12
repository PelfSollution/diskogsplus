import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import { WantlistEntry } from "@/services/supabase/addWantlistEntry";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { decryptCookieJSON, requireSessionUser } from "@/lib/session";
var Discogs = require("disconnect").Client;

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
    // El usuario sale siempre de la sesión, nunca del body
    const username = requireSessionUser(req, res);
    if (!username) return;

    if (!isSupabaseConfigured) {
      return res.status(503).json({
        error_code: "supabase_not_configured",
        message: "Supabase no está configurado: la wantlist no se puede guardar.",
      });
    }

    const accessData = decryptCookieJSON(getCookie("accessData", { req, res }));
    if (!accessData) {
      return res.status(401).json({
        error_code: "no_access_data",
        message: "No se encontraron datos de acceso de Discogs.",
      });
    }

    const userClient = new Discogs(accessData).user();

    // Discogs pagina la wantlist (máx. 100 por página): recorrer todas
    const wants: DiscogsRelease[] = [];
    for (let page = 1, pages = 1; page <= pages; page++) {
      const userWantlist = await userClient
        .wantlist()
        .getReleases(username, { page, per_page: 100 });

      if (!userWantlist || !Array.isArray(userWantlist.wants)) {
        res.status(400).json({
          error_code: "no_valid_releases",
          message: "Respuesta de Discogs no contiene releases válidos.",
        });
        return;
      }

      wants.push(...userWantlist.wants);
      pages = userWantlist.pagination?.pages || 1;
    }

    const formattedEntries: WantlistEntry[] = wants.map(
      (release: DiscogsRelease) => {
        const basicInfo = release.basic_information;

        return {
          username: username,
          disco_id: release.id,
          notes: release.notes || "Sin notas",
          rating: release.rating || 0,
          artista: basicInfo.artists?.[0]?.name || "",
          album: basicInfo.title,
          image_url: basicInfo.thumb || "/no-portada.gif",
        };
      }
    );

    // Una sola petición; los discos que ya estaban se ignoran
    const { data, error } = await supabase
      .from("wantlist")
      .upsert(formattedEntries, {
        onConflict: "username,disco_id",
        ignoreDuplicates: true,
      })
      .select("disco_id");
    if (error) throw error;

    res.send({
      success: true,
      total: formattedEntries.length,
      added: data?.length ?? 0,
    });
  } catch (err: any) {
    console.error("Error al importar wantlist:", err);
    res.status(400).json({
      error_code: "wantlist_import",
      message: err.message,
    });
  }
}
