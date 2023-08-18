import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import TopNavBar from "@/components/top-nav-bar"

export default function Home() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <TopNavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <header className="text-center mb-8">
      <Image 
        src="/diskogs-logo.gif" 
        alt="Diskogs plus" 
        className="w-full max-w-full" 
        width={500} 
        height={149}
    />
        <p className="text-xl mt-2">Descripción de la app</p>
      </header>
      {!isLoggedIn &&  <Button onClick={() => router.push('/api/auth/authorize')} className="self-center">Hacer Login con Discogs</Button>}
    </div>
  )
}
