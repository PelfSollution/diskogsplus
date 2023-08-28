import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";


export const list = query(async (ctx): Promise<Doc<"tracks">[]> => {
  return await ctx.db.query("tracks").collect();
});
