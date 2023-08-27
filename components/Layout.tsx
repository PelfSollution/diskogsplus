// Layout.tsx
import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import TopNavBar from "@/components/TopNavBar";

interface LayoutProps {
    children: ReactNode;
    centeredContent?: boolean;
    allowPublicAccess?: boolean; 
}

const Layout: React.FC<LayoutProps> = ({ children, centeredContent = true, allowPublicAccess = false }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!getCookie('username') && !allowPublicAccess) {
            router.push('/');  // Redirigir al inicio si la cookie no existe y no es acceso público
            return;
        }
        setIsLoggedIn(!!getCookie('username'));
    }, [getCookie, allowPublicAccess, router]);

    const handleLogout = () => {
        setIsLoggedIn(false);
        router.push('/');
    }

    if (isLoggedIn === null) return null; 
    // Agregué un margen superior de 20px para que no se superponga con la barra de navegación superior
    return (
        <div className={`tw-min-h-screen tw-flex tw-flex-col ${centeredContent ? 'tw-items-center tw-justify-center' : ''} tw-bg-gray-100`}>
        <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="tw-mt-10"> 
            {children}
        </div>
    </div>
    
    );
}

export default Layout;


