import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const mixtapes = await ctx.db.query("mixtapes").collect();

    return mixtapes;
  },
});
