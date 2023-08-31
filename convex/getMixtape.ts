import { query } from './_generated/server'
import { Doc } from './_generated/dataModel'

export const list = query(async (ctx): Promise<Doc<"mixtape">[]> => {
  return await ctx.db.query("mixtape").collect();
});