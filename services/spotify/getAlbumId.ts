export async function getSpotifyAlbumId(albumName: string, artistName: string, accessToken: string) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=album:${albumName} artist:${artistName}&type=album`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    
      const data = await response.json();
    
      if (data.error) {
        throw new Error(data.error.message);
      }
    
      if (data.albums.items.length === 0) {
        return null;
      }
    
      return data.albums.items[0].id;
  }