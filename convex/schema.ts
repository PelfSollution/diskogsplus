import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    mixtape: defineTable({
      userName: v.string(), // ID del usuario, que podría ser un nombre de usuario, email, o cualquier identificador único
      discogsAlbumId: v.string(),
      spotifyTrackId: v.optional(v.string()),
      artistName: v.string(),
      trackName: v.string(),
      // ... (otros campos que consideres necesarios)
    }).index("by_userName", ["userName"]),
  });

