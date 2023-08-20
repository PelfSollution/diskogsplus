import Layout from "@/components/Layout";
import useGetAlbumList from "@/hooks/useGetAlbumList";
import Link from 'next/link';
import { useState } from 'react';

interface Artist {
  name: string;

}

interface Album {
  id: number;
  basic_information: {
    cover_image: string;
    artists: Artist[];
    title: string;
    created_at: string;
  };
}

function Albums() {
  const { data: albums, isLoading, error, size, setSize } = useGetAlbumList();
  const allAlbums = albums ? albums.flatMap((page) => page.releases) : [];

  console.log("All albums data:", allAlbums);


  const [filter, setFilter] = useState<"name" | "album" | "added" | "year" | "">("");

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderAsc, setOrderAsc] = useState<boolean>(true);

  let filteredAlbums = [...allAlbums];

  if (searchTerm) {
    filteredAlbums = filteredAlbums.filter(album => 
      album.basic_information.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  switch(filter) {
    case "name":
      // Ordenar por nombre del artista
      filteredAlbums.sort((a, b) => {
        const artistA = a.basic_information.artists[0]?.name || "";
        const artistB = b.basic_information.artists[0]?.name || "";
        return artistA.localeCompare(artistB);
      });
      break;
    case "album":
      // Ordenar por título del álbum
      filteredAlbums.sort((a, b) => a.basic_information.title.localeCompare(b.basic_information.title));
      break;
    case "added":
      // Ordenar por fecha añadido. Aquí estoy asumiendo que 'created_at' es una cadena ISO de fecha.
      filteredAlbums.sort((a, b) => new Date(a.basic_information.created_at).getTime() - new Date(b.basic_information.created_at).getTime());
      break;
    case "year":
      // Ordenar por año de lanzamiento si tienes esa propiedad. Por el momento lo dejaremos sin implementar ya que no veo la propiedad en el objeto que has compartido.
      break;
}


  if (!orderAsc) {
    filteredAlbums.reverse();
  }

  const loadMoreAlbums = () => {
    setSize(size + 1);
  };

  if (isLoading) {
    return <p>Cargando álbumes...</p>;
  }

  if (error || !allAlbums) {
    return <p>Error al cargar los álbumes.</p>;
  }

  if (allAlbums.length === 0) {
    return (
      <Layout centeredContent={false}>
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Álbumes</h1>
          <p>No hay álbumes disponibles para mostrar.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout centeredContent={false}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Álbumes</h1>
        <div className="my-4">
        <select onChange={(e) => setFilter(e.target.value as any)} className="ml-4 p-2">
  <option value="">Selecciona un filtro</option>
  <option value="name">Nombre</option>
  <option value="album">Álbum</option>

</select>
          
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-4 p-2 border rounded"
          />

          <button onClick={() => setOrderAsc(!orderAsc)} className="ml-4">
            {orderAsc ? '⬆️' : '⬇️'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map((album: Album) => (
            <Link key={album.id} href={`/albums/${album.id}`} passHref>
              <div className="bg-white p-4 rounded shadow cursor-pointer">
                <img
                  src={album.basic_information.cover_image}
                  alt={album.basic_information.title}
                  className="w-full h-48 object-cover mb-2 rounded"
                />
                <h2 className="text-xl">
    <span className="font-bold">
        {album.basic_information.artists && album.basic_information.artists.length > 0 
            ? album.basic_information.artists[0].name 
            : "Artista desconocido"}
    </span> - {album.basic_information.title}
</h2>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={loadMoreAlbums}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full"
        >
          Cargar más álbumes
        </button>
      </div>
    </Layout>
  );
}

export default Albums;
