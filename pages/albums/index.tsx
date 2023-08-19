// Importo los componentes y hooks necesarios.
import Layout from "@/components/Layout";
import useGetAlbumList from "@/hooks/useGetAlbumList";

// Esta es la interfaz que define la estructura de un álbum.
interface Album {
  id: number;
  basic_information: {
    cover_image: string;
    title: string;
  };
  // Puedes añadir más propiedades según lo necesites.
}

// El componente principal que renderiza los álbumes.
function Albums() {
  // Uso el hook para obtener la lista de álbumes.
  const { data: albums, isLoading, error, size, setSize } = useGetAlbumList();

  // Si hay álbumes, hacemos un flatMap para tener una sola lista.
  const allAlbums = albums ? albums.flatMap((page) => page.releases) : [];

  // Esta función la usaré para cargar más álbumes cuando el usuario lo desee.
  const loadMoreAlbums = () => {
    setSize(size + 1);
  };

  // Imprimo algunos logs para depurar y ver cómo va todo.
  console.log("Data recibida:", allAlbums);
  console.log("Estado de carga:", isLoading);
  console.log("Error:", error);

  // Si está cargando, muestro un mensaje al usuario.
  if (isLoading) {
    return <p>Cargando álbumes...</p>;
  }

  // Si hay algún error o no hay datos, informo al usuario.
  if (error || !allAlbums) {
    return <p>Error al cargar los álbumes.</p>;
  }

  // Si no hay álbumes disponibles, informo de ello.
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

  // Si todo va bien, renderizo la lista de álbumes.
  return (
    <Layout centeredContent={false}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Álbumes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAlbums.map((album: Album) => (
            <div key={album.id} className="bg-white p-4 rounded shadow">
              <img
                src={album.basic_information.cover_image}
                alt={album.basic_information.title}
                className="w-full h-48 object-cover mb-2 rounded"
              />
              <h2 className="text-xl">{album.basic_information.title}</h2>
            </div>
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
