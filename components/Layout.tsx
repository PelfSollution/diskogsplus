// Layout.tsx
import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import TopNavBar from "@/components/TopNavBar";

interface LayoutProps {
    children: ReactNode;
    centeredContent?: boolean;
    centeredTopContent?: boolean; 
    allowPublicAccess?: boolean; 
}

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    centeredContent = true, 
    centeredTopContent = false, // Por defecto lo ponemos a false
    allowPublicAccess = false 
}) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!getCookie('username') && !allowPublicAccess) {
            router.push('/');  // Redirigir al inicio si la cookie no existe y no es acceso público
            return;
        }
        setIsLoggedIn(!!getCookie('username'));
    }, [allowPublicAccess, router]);

    const handleLogout = () => {
        setIsLoggedIn(false);
        router.push('/');
    }

    if (isLoggedIn === null) return null; 

    let containerClass = ''; 
    if (centeredTopContent) {
        containerClass = 'tw-flex tw-items-center tw-justify-start';
    } else if (centeredContent) {
        containerClass = 'tw-flex tw-items-center tw-justify-center';
    } else {
        containerClass = 'tw-flex tw-justify-start';
    }
    

    // Agregué un margen superior de 20px para que no se superponga con la barra de navegación superior
    return (
        <div className={`tw-min-h-screen tw-flex tw-flex-col ${containerClass} tw-bg-gray-100`}>
        <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="tw-flex tw-justify-center tw-mt-10 tw-w-full">
            <div className="tw-max-w-screen-xl tw-w-full">
                {children}
            </div>
        </div>
    </div>
    
    );
}

export default Layout;


