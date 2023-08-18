import { useState } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import format from 'date-fns/format';
import useGetUserData from '@/hooks/useGetUserData';
import { Button } from "@/components/ui/button"
import TopNavBar from "@/components/top-nav-bar";

function Dashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const router = useRouter();
    const username = getCookie('username');
    const { data, error, isLoading, isValidating } = useGetUserData();

    const handleLogout = () => {
        setIsLoggedIn(false);
        router.push('/');
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />

            <header className="text-center mb-8">
                {isLoggedIn && 
                    <div>
                        {error && !isLoading && <div>Error: failed to load</div>}
                        {isLoading || isValidating && <div>Loading...</div>}

                        {data?.userProfile && Object.keys(data).length > 0 ? (
                            <div>
                                <h1 className='text-2xl'>Hola, <span className="font-bold text-blue-500">{data.userProfile.username}</span></h1>
                                {data.userProfile.avatar_url && <img className='mt-4 rounded-full object-cover' src={data.userProfile.avatar_url} alt={`${data.userProfile.username} profile pic`} />}
                                <p className='mt-4'><span className="font-bold">Registrado:</span> {format(new Date(data.userProfile.registered), 'dd/MM/yyyy HH:mm')}</p>
                                <p>Tu tienes <span className="font-bold text-blue-500">{data.userProfile.num_collection}</span> discos en tu colecci&oacute;n.</p>
                                <Button onClick={() => router.push('/albums')} className="mt-4 self-center">Ver Discos</Button>
                            </div>
                        ) : (
                            <p>Inicie sesi&oacute;n para ver su perfil.</p>
                        )}
                    </div>
                }
            </header>
        </div>
    );
}

export default Dashboard;
  