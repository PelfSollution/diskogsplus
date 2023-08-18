import { useState } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import useGetUserData from '@/hooks/useGetUserData';
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
                        <p className="text-xl">Loggin Realizado!</p>
                        
                        {error && !isLoading && <div>Error: failed to load</div>}
                        {isLoading || isValidating && <div>Loading...</div>}

                        {data?.userProfile && Object.keys(data).length > 0 ? (
                            <div>
                                <h1>Hola, {data.userProfile.username}</h1>
                                {data.userProfile.avatar_url && <img src={data.userProfile.avatar_url} alt={`${data.userProfile.username} profile pic`} />}
                                <p>Registrado: {data.userProfile.registered}</p>
                                <p>Tu tienes {data.userProfile.num_collection} discos en tu colecci&oacute;n.</p>

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
  