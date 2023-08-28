import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";


export const list = query(async (ctx): Promise<Doc<"mixtapes">[]> => {
  return await ctx.db.query("mixtapes").collect();
});


