import Image from 'next/image';
import { useRouter } from 'next/router';
import { deleteCookie } from 'cookies-next'; 
import { Button } from "@/components/ui/button";

interface TopNavBarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}


export default function TopNavBar({ isLoggedIn }: TopNavBarProps) {
  const router = useRouter(); 

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
     // 1. Eliminar cookies
     deleteCookie('username', { path: '/' });
     deleteCookie('isLoggedIn', { path: '/' });
     deleteCookie('CookieConsent', { path: '/' });
     
     // 2. Llamar a la API de logout (opcional, si tu aplicación lo requiere)
     await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`);
     
     // 3. Redireccionar al inicio o a la página de login
     router.push('/');
  };

  return (
      <nav className="tw-w-full tw-bg-white tw-shadow-md tw-py-2 tw-px-4 tw-fixed tw-top-0 tw-left-0 tw-z-10">
      <div className="tw-container tw-mx-auto tw-flex tw-justify-between tw-items-center">
        <Image src="/diskogs-logo.gif" alt="Diskogs plus" className="tw-w-24" width={200} height={60}/>
        <ul className="tw-flex tw-space-x-4 tw-items-center">
          <li className="tw-cursor-pointer tw-inline-flex tw-items-center" onClick={() => router.push('/dashboard')}>Home</li>
          <li className="tw-cursor-pointer tw-inline-flex tw-items-center" onClick={() => router.push('/albums')}>Álbumes</li>
          <li className="tw-cursor-pointer tw-inline-flex tw-items-center" onClick={() => router.push('/mixtape')}>Mixtape</li>
          <li className="tw-cursor-pointer tw-inline-flex tw-items-center" onClick={() => router.push('/compara')}>Matching</li>
          <li>
            <Button variant="destructive" onClick={handleLogout} className="tw-bg-red-500 tw-hover:bg-red-600 tw-text-white">
              Logout
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
