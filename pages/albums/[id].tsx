import { useRouter } from 'next/router';
import Layout from "@/components/Layout";

function AlbumDetails() {
    const router = useRouter();
    const { id } = router.query;

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <h1>Detalles del álbum con ID: {id}</h1>
                <p>Info detallada del disco {id}.</p>
            </div>
        </Layout>
    );
}

export default AlbumDetails;

