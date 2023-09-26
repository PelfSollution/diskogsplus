import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { encrypt } from '../../lib/cryptoUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, apiKey } = req.body;

  if (req.method === 'POST') {
    try {
      const encryptedKey = encrypt(apiKey);  // Llamar al método de encriptación
      const { data, error } = await supabase
          .from('users')
          .upsert([
              { username, openai_api_key: encryptedKey }
          ]);

          if (error && typeof error === 'object' && 'message' in error) {
            throw new Error(error.message);
          }
      
      res.status(200).json({ status: 'Clave API guardada con éxito' });
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
