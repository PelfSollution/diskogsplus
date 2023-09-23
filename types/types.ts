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

  export interface Artist {
    name: string;
  }
  export interface Album {
    id: number;
    basic_information: {
      cover_image: string;
      artists: Artist[];
      title: string;
      created_at: string;
    };
  }

  export interface SimilarArtist {
    name: string;
    mbid: string; 
    match: string; 
    url: string;
    image: Array<{
      size: string;
      "#text": string;
    }>;
    streamable: '0' | '1'; 
  }
  
  export interface SimilarTrack {
    name: string;
    playcount: number;
    mbid?: string;
    match: number;
    url: string;
    streamable: any; 
    duration?: number;
    artist: {
      name: string;
     
    };
    image: any[]; 
  }
  