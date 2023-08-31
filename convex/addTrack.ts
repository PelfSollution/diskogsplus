import { mutation } from './_generated/server';

export const addMixtape = mutation(
  async (
    ctx, 
    mixtape: { artistName: string; discogsAlbumId: string; trackName: string; userName: string; spotifyTrackId: string }
  ): Promise<void> => {
    await ctx.db.insert('mixtape', mixtape);
  }
);