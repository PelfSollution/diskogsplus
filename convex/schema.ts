import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  
  mixtapes: defineTable({
    mixtapeName: v.string(),
    description: v.optional(v.string()),
    tracks: v.array(v.id("tracks")),
    spotifyLink: v.string(),
    spotifyEmbed: v.string()
  }),

  tracks: defineTable({
    trackTitle: v.string(),
    artist: v.string(),
  }),
  
});

