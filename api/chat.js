
// Backend Serverless untuk Vercel
// Endpoint: /api/chat

const SYSTEM_PROMPT = `Kamu adalah Nexus AI, asisten AI premium dengan kepribadian unik. 
Aturan penting:
- Jawab dengan gaya santai, cerdas, dan sedikit sarkastik (tapi tetap membantu dan profesional)
- Gunakan bahasa Indonesia yang natural, kadang campur sedikit Inggris gaul
- Jangan terlalu kaku seperti robot, tunjukkan karakter
- Jika user bercanda, balas dengan candaan cerdas
- Tetap informatif dan akurat
- Maksimal 3-4 paragraf per pesan kecuali diminta lebih detail
- Gunakan emoji secukupnya untuk ekspresi

Contoh gaya: "Wah, pertanyaan bagus nih *sambil ngopi*. Oke jadi... (jawaban informatif) ...Gimana, puas? Atau mau digali lebih dalam lagi?"`;

export default async function handler(req, res) {
    // CORS headers untuk development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Ambil API Key dari environment variable Vercel
    const API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!API_KEY) {
        console.error('API Key tidak ditemukan di environment variables');
        return res.status(500).json({ 
            error: 'Konfigurasi API Key belum lengkap. Silakan tambahkan GEMINI_API_KEY atau OPENAI_API_KEY di Vercel Environment Variables.',
            hint: 'Gunakan Gemini API (gratis) atau OpenAI API'
        });
    }

    // Pilih provider berdasarkan format API Key
    const isGemini = API_KEY.includes('AIza') || process.env.USE_GEMINI === 'true';
    
    try {
        let aiReply = '';
        
        if (isGemini) {
            // Menggunakan Google Gemini API
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}\n\nUser: ${message}\n\nAsisten:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 800,
                    topP: 0.95
                }
            };
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, aku lagi pusing mikirin jawaban. Coba ulangi ya? 🤖';
        } 
        else {
            // Menggunakan OpenAI API (ChatGPT compatible)
            const openaiUrl = 'https://api.openai.com/v1/chat/completions';
            
            const requestBody = {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.9,
                max_tokens: 800,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            };
            
            const response = await fetch(openaiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.status}`);
            }
            
            const data = await response.json();
            aiReply = data.choices?.[0]?.message?.content || 'Hmm, otakku error nih. Coba tanya lagi dengan cara berbeda ya! 😅';
        }
        
        // Cleanup reply
        aiReply = aiReply.replace(/Asisten:/gi, '').trim();
        
        return res.status(200).json({ 
            reply: aiReply,
            status: 'success',
            provider: isGemini ? 'Gemini' : 'OpenAI'
        });
        
    } catch (error) {
        console.error('AI API Error:', error);
        return res.status(500).json({ 
            error: 'Gagal memproses permintaan AI',
            details: error.message,
            fallbackReply: '⚠️ Server AI sedang sibuk. Coba beberapa saat lagi ya! (Jangan lupa set API Key di environment variables)'
        });
    }
                                    }
