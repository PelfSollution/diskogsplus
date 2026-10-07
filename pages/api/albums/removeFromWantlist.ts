import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import deleteWantlistEntry from "@/services/supabase/deleteWantlistEntry";
import { decryptCookieJSON, requireSessionUser } from "@/lib/session";
var Discogs = require("disconnect").Client;


export default async function removeFromWantlist(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // El usuario sale siempre de la sesión, nunca del body
    const username = requireSessionUser(req, res);
    if (!username) return;

    const { disco_id } = req.body;
    const accessData = decryptCookieJSON(getCookie("accessData", { req, res }));

    if (!accessData) {
      return res.send({
        success: false,
        message: "No se encontraron datos de acceso.",
      });
    }

    const userClient = new Discogs(accessData).user();
    const userWantlist = userClient.wantlist();

    try {
      const removalResponse = await userWantlist.removeRelease(
        username,
        disco_id
      );
      const supabaseResponse = await deleteWantlistEntry(username, disco_id);

      if (!supabaseResponse) {
        throw new Error("Error al eliminar de Supabase.");
      }

      res.send({ success: true, data: removalResponse });
    } catch (discogsOrSupabaseError: any) {
      throw new Error(
        `Error durante la eliminación: ${discogsOrSupabaseError.message}`
      );
    }
  } catch (err: any) {
    res.status(400).json({
      error_code: "wantlist_removal",
      message: err.message,
    });
  }
}
