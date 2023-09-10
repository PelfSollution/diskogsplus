import Layout from "@/components/Layout";
import React from "react";
import { useRouter } from 'next/router';
import CustomCircularProgress from "@/components/CustomCircularProgress";

export default function MixtapePlayer() {
    const router = useRouter();
    const { embedUrl } = router.query;

    return (
        <Layout centeredTopContent={true} title="Mi Mixtape [Diskogs +] - Diskogs +" description="Mixtape Digital con todos los temas de los discos que has añadido">
            <div className="tw-container tw-mx-auto tw-p-6">
                <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Mixtape</h1>
                <div className="w-full max-w-xl">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl as string}
                            width="100%"
                            height="800"
                            frameBorder="0"
                            allowTransparency={true}
                            allow="encrypted-media"
                        ></iframe>
                    ) : (
                        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
                            <CustomCircularProgress />
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
