export async function getSpotifyTrackId(trackName: string, artistName: string, accessToken: string): Promise<string | null> {
    const response = await fetch(`https://api.spotify.com/v1/search?q=track:${trackName} artist:${artistName}&type=track`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    if (data.tracks.items.length === 0) {
        return null;
    }
    
    return data.tracks.items[0].id;
}
