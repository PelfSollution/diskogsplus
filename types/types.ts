export type Mixtape = {
    _creationTime: number;
    _id: string;
    description: string;
    mixtapeName: string;
    spotifyEmbed: string;
    spotifyLink: string;
    tracks: string[];
  };

  export interface ChatLog {
    artista: string;
    album: string;
    disco_id: number;
  }
  
  export type WantlistEntry = {
    username: string;
    disco_id: number;
    notes?: string;
    rating?: number;
  };