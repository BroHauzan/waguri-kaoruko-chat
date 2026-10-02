import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChatTurn } from '../server/geminiService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers untuk Capacitor WebView
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const result = await handleChatTurn(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('API /api/chat error:', err);
    return res.status(500).json({
      error: 'Failed to generate chat response',
      details: err?.message || String(err),
    });
  }
}