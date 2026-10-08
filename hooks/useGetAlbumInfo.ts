import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Error fetching data");
    }
    return res.json();
  });

  interface Video {
    uri: string;
    title: string;
    description: string;
    duration: number;
    embed: boolean;
  }

  interface Image {
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
    url: string;
  }
  

  interface SimilarArtist {
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
  
  
  

export interface AlbumInfoInterface {
  albumId: string;
  coverImage: string;
  backCoverImage: string;
  artist: string;
  title: string;
  label: string;
  catalogNo: string;
  rating: number;
  released: string;
  year?: string | number;
  releaseDate?: string;
  country: string;
  format?: string;
  videos?: Video[];
  genres: string[];
  styles: string[];
  tracklist: {
    position: string;
    title: string;
    duration: string;
    spotifyTrackId?: string;
    spotifyUri?: string;
    tempo?: number;
    key?: number;
    mode?: number;
  }[];
  lastfmTags?: string[];
  enrichedInfo?: string;
  spotifyAlbumId?: string;
  isPopularAlbum?: boolean;
  similarArtists?: SimilarArtist[];
  similarTracks?: SimilarTrack[];
  artistBio?: string;

}

export interface AlbumInfoPropsInterface {
  data: {
    albumInfo: AlbumInfoInterface;
  };
  error: boolean | undefined;
  isLoading: boolean | undefined;
  isValidating: boolean | undefined;
}

const useGetAlbumInfo = (id: number, masterId?: number) => {
  // Solo consultar si el ID es numérico y válido (> 0)
  const isValidId = Boolean(id && !isNaN(id) && id > 0);
  const url = isValidId ? `/api/albums/albumInfo?id=${id}` : null;

  const { data, error, isValidating, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  if (error) console.error("[useGetAlbumInfo] Error fetching album info:", error);

  const isLoading = isValidId && !data && !error;

  return {
    data: data?.albumInfo as AlbumInfoInterface | undefined,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

export default useGetAlbumInfo;
