import { supabase } from '../lib/supabase';
import Layout from "@/components/Layout";
import React, { useState, useEffect } from 'react';


interface Mixtape {
    artistName: string;
    discogsAlbumId: string;
    trackName: string;
    userName: string;
    spotifyTrackId: string;
  }  

export default function TestSupabase() {
    const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: mixtapes, error } = await supabase.from('mixtape').select('*').limit(10);
      if (error) {
        console.error('Error obteniendo datos:', error);
      } else {
        setData(mixtapes);
      }
    }

    fetchData();
  }, []);

  return (
    <Layout>
    <div>
      <h1>Prueba de Supabase</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
    </Layout>
  );
}
