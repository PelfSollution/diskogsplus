import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const tracks = await ctx.db.query("tracks").collect();

    return tracks;
  },
});
