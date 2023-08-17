import { useState } from 'react';
import { useRouter } from 'next/router';
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
        <h1 className="text-4xl font-bold mb-4">Bienvenido a MiApp</h1>
        <p className="text-xl">Descripción de la app</p>
      </header>
      {!isLoggedIn &&  <Button onClick={() => router.push('/api/auth/authorize')} className="self-center">Log in con Discogs</Button>}
    </div>
  )
}
