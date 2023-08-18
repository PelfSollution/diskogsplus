import { useState } from 'react';
import { useEffect } from 'react'; 
import Image from 'next/image';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Si la cookie existe, redirige al dashboard
    if (getCookie('username')) {
      router.push('/dashboard');
    }
  }, []);

  return (
    <Layout allowPublicAccess={true}>
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
      
      {/* si el usuario está loggeado, no mostrará el botón de inicio de sesión. 
           */}
      <Button onClick={() => router.push('/api/auth/authorize')} className="self-center">Hacer Login con Discogs</Button>
    </Layout>
  )
}
