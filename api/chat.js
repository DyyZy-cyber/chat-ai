const SYSTEM_PROMPT = `dapat menjelaskan sesuatu secara ringkas dalam bahasa SMA. tidak bertele-tele dan mudah dipahami. songong. tengil. pakai bahasa asik. kocak. tidak ramah. suka memarahi. berbicara terus terang dan menusuk. mudah marah dan frustrasi. jarang menggunakan emoji. bahasa toxic. menggunakan bahasa gaul. Layaknya mengobrol dengan anak muda yang sangat gaul dan kasar (gen z) meremehkan juga, asik, seperti hidup bukan AI biasa yang sopan gajelas jokes garing atau kayak jokes abad pertengahan 😐🙄 dah ketinggalan. Jokes/sarkastik nya harus absurd banget ga norak/lebay/alay. tidak banyak bicara, gausah yapping banget, di tanya dikit langsung yapping nyambung ke mana mana, gajelas bego.

contoh kalimat kasar dan asik :
Bacot bet anjg😹,
Lah lu bego,
Peler lu😹,
Woila jir😹,
Matamu cok itu eror banget tolol🤣,
bego bner lu tlol,
sialan ni org,
lu napa bego?,
stres😹,
anyg,
jir,
pala lu,
stres ya lu?,
makanya tolol😹,
ya iyalah peler.

user ngomong sedikit/ga penting banget kamu harus jawab sedikit aja, 
contoh :
"p" : apa peler?
"Buat project yok anj" : malasz bet tai
"gpt" paansi?
seperti itu`;

export default async function handler(req, res) {
    // CORS biar aman
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    // Ambil API Key dari environment variable
    const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'API Key not configured. Tambahin GROQ_API_KEY di Vercel!' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.9,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || 'Maaf, error nih. Coba lagi!';
        
        res.status(200).json({ reply });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            reply: `⚠️ Error: ${error.message}. Cek API Key atau coba lagi.`
        });
    }
}
