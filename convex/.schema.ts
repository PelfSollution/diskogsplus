import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    discogsUserId: v.string(),
    creationDate: v.string(),  
    lastAccessDate: v.string(),
    mixtapes: v.array(v.id("mixtapes"))
  }),
  
  mixtapes: defineTable({
    mixtapeId: v.id("mixtapes"),
    userId: v.id("users"),
    mixtapeName: v.string(),
    description: v.optional(v.string()),
    creationDate: v.string(),
    tracks: v.array(v.id("tracks")),
    spotifyLink: v.string(),
    spotifyEmbed: v.string()
  }),

  tracks: defineTable({
    trackId: v.id("tracks"),
    trackTitle: v.string(),
    artist: v.string(),
    discId: v.id("discogs"), 
    duration: v.string(),
    spotifySongLink: v.optional(v.string()) 
  }),
  
});
