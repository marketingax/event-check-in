
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Example: fetch all rows from a 'test' table
  const { data, error } = await supabase.from('test').select('*');
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
}
