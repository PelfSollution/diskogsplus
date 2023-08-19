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
      <nav className="w-full bg-white shadow-md py-2 px-4 fixed top-0 left-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Image src="/diskogs-logo.gif" alt="Diskogs plus" className="w-24" width={200} height={60}/>
        <ul className="flex space-x-4 items-center">
          <li className="cursor-pointer inline-flex items-center" onClick={() => router.push('/dashboard')}>Home</li>
          <li className="cursor-pointer inline-flex items-center" onClick={() => router.push('/albums')}>Álbumes</li>
          <li>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              Logout
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
