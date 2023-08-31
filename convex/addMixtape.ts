import { mutation } from './_generated/server'

export default mutation(
  async (
    { db },
    mixtape: { artistName: string; discogsAlbumId: string; trackName: string; userName: string; spotifyTrackId: string }
  ) => {
    await db.insert('mixtape', mixtape)
  }
)