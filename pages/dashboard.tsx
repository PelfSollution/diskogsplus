import format from 'date-fns/format';
import { useRouter } from 'next/router'; 
import useGetUserData from '@/hooks/useGetUserData';
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const isDateValid = (dateString: string): boolean => {
    return !isNaN(Date.parse(dateString));
};

function Dashboard() {
    const router = useRouter();
    const { data, error, isLoading, isValidating } = useGetUserData();

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center w-full">
                <header className="text-center mb-8">
                    <div>
                        {error && !isLoading && <div>Error: failed to load</div>}
                        {isLoading || isValidating && <div>Loading...</div>}

                        {data?.userProfile && Object.keys(data).length > 0 ? (
                            <div>
                                <h1 className='text-2xl'>Hola, <span className="font-bold text-blue-500">{data.userProfile.username}</span></h1>
                                {data.userProfile.avatar_url && <img className='mt-4 rounded-full object-cover' src={data.userProfile.avatar_url} alt={`${data.userProfile.username} profile pic`} />}
                                
                                {isDateValid(data.userProfile.registered) ? (
                                    <p className='mt-4'><span className="font-bold">Registrado:</span> {format(new Date(data.userProfile.registered), 'dd/MM/yyyy HH:mm')}</p>
                                ) : (
                                    <p className='mt-4'><span className="font-bold">Registrado:</span> Fecha desconocida</p>
                                )}

                                <p>Tu tienes <span className="font-bold text-blue-500">{data.userProfile.num_collection}</span> discos en tu colecci&oacute;n.</p>
                                <Button onClick={() => router.push('/albums')} className="mt-4 self-center">Ver Discos</Button>
                            </div>
                        ) : (
                            <p>Inicie sesi&oacute;n para ver su perfil.</p>
                        )}
                    </div>
                </header>
            </div>
        </Layout>
    );
}

export default Dashboard;


  