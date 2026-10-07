import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { encrypt } from '../../lib/cryptoUtils';
import { requireSessionUser } from '../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();  // Método no permitido
  }

  // El usuario sale siempre de la sesión, nunca del body
  const username = requireSessionUser(req, res);
  if (!username) return;

  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'La clave API es obligatoria' });
  }

  try {
    const encryptedKey = encrypt(apiKey);  // Llamar al método de encriptación
    const { error } = await supabase
        .from('users')
        .upsert([
            { username, openai_api_key: encryptedKey }
        ]);

    if (error && typeof error === 'object' && 'message' in error) {
      throw new Error(error.message);
    }

    res.status(200).json({ status: 'Clave API guardada con éxito' });
  } catch (error: unknown) {
    console.error('Error guardando la clave API:', error);
    res.status(500).json({ error: 'No se pudo guardar la clave API' });
  }
}
