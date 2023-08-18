import Layout from "@/components/Layout";

function Albums() {

    // Demo
    const albums = [
        { id: 1, title: 'Álbum 1', imageUrl: '/path/to/image1.jpg' },
        { id: 2, title: 'Álbum 2', imageUrl: '/path/to/image2.jpg' },
    ];

    return (
        <Layout centeredContent={false}>
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Álbumes</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map(album => (
                        <div key={album.id} className="bg-white p-4 rounded shadow">
                            <img src={album.imageUrl} alt={album.title} className="w-full h-48 object-cover mb-2 rounded" />
                            <h2 className="text-xl">{album.title}</h2>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}

export default Albums;

