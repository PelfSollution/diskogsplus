
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { decrypt } from '../../lib/cryptoUtils';  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.body;

  if (req.method === 'POST') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('openai_api_key')
        .eq('username', username)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.openai_api_key) {
        const decryptedKey = decrypt(data.openai_api_key);
        res.status(200).json({ apiKey: decryptedKey });
      } else {
        res.status(404).json({ error: 'Clave API no encontrada' });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Un error desconocido ocurrió' });
      }
    }
  } else {
    res.status(405).end();  // Método no permitido
  }
}
