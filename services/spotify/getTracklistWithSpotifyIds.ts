import { getTrackAudioFeatures } from "../../services/spotify/getTrackAudioFeatures";
import { getSpotifyTrackId } from "../../services/spotify/getTrackId";
import { millisToMinutesAndSeconds } from "@/lib/utils";

type Track = {
    title: string;
    spotifyTrackId?: string | null;
    spotifyUri?: string | null;
    tempo?: number | null;
    key?: number | null;
    mode?: number | null;
    duration?: string | null;
};

async function getPrimaryArtistName(releaseData: any): Promise<string> {
    return releaseData.artists && releaseData.artists.length > 0
        ? releaseData.artists[0].name
        : "";
}

async function extractSpotifyTrackId(spotifyTrackData: any): Promise<string | null> {
    if (!spotifyTrackData || !spotifyTrackData.uri || spotifyTrackData.uri.split(":").length !== 3) {
        return null;
    }
    return spotifyTrackData.uri.split(":")[2];
}

async function getSpotifyTrackDetails(track: Track, accessToken: string, primaryArtistName: string, releaseTitle: string): Promise<Partial<Track>> {
    const spotifyTrackData = await getSpotifyTrackId(track.title, primaryArtistName, releaseTitle, accessToken);
    const spotifyTrackId = await extractSpotifyTrackId(spotifyTrackData);

    if (!spotifyTrackId) {
        return {
            spotifyTrackId: null,
            spotifyUri: null,
        };
    }

    const trackFeatures = await getTrackAudioFeatures(spotifyTrackId, accessToken);

    return {
        spotifyTrackId,
        spotifyUri: spotifyTrackData?.uri ?? null,
        tempo: trackFeatures?.tempo ?? null,
        key: trackFeatures?.key ?? null,
        mode: trackFeatures?.mode ?? null,
        duration: trackFeatures?.duration_ms ? millisToMinutesAndSeconds(trackFeatures.duration_ms) : null,
    };
}

export async function getTracklistWithSpotifyIds(selectedTracklist: Track[], releaseData: any, accessToken: string): Promise<Track[]> {
    const primaryArtistName = await getPrimaryArtistName(releaseData);

    return Promise.all(
        selectedTracklist.map(async (track) => {
            try {
                const spotifyTrackDetails = await getSpotifyTrackDetails(track, accessToken, primaryArtistName, releaseData.title);
                return { ...track, ...spotifyTrackDetails };
            } catch (error) {
                console.error(`Error procesando el track ${track.title}:`, error);
                return track; // En caso de error, retornamos el track sin cambios.
            }
        })
    );
}
