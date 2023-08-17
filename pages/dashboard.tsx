import { useState } from 'react';
import { useRouter } from 'next/router';
import TopNavBar from "@/components/top-nav-bar"

function Dashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const router = useRouter();

    const handleLogout = () => {
        setIsLoggedIn(false);

        // Redirigir al usuario a la página raíz
        router.push('/');
    }

    return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <header className="text-center mb-8">
        { isLoggedIn && 
            <p className="text-xl">Loggin Realizado! - INFO DE USUARIO</p>
        }
        </header>
    </div>
    );
}

export default Dashboard;
  