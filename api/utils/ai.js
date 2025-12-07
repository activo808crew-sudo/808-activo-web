/**
 * Generates an exciting announcement text using AI (Groq -> Gemini -> Fallback)
 * @param {object} eventData - Title, description, etc.
 * @returns {Promise<string>} - Generated text
 */
export async function generateAnnouncementText(eventData) {
    if (!process.env.GROQ_API_KEY) {
        console.warn('[AI] No GROQ_API_KEY provided. Using fallback text.');
        return `¡Nuevo evento en 808 Activo! **${eventData.title}** está aquí. ¡No se lo pierdan!`;
    }

    let timeString = '';
    if (eventData.start_date) {
        try {
            // Construct ISO string for Date parsing (YYYY-MM-DDTHH:mm:ss)
            const dateStr = eventData.start_date instanceof Date
                ? eventData.start_date.toISOString().split('T')[0]
                : eventData.start_date;

            const timeStr = eventData.start_time || '00:00:00';
            // Combine and parse to Unix timestamp (seconds)
            const fullDate = new Date(`${dateStr}T${timeStr}`);
            const unixTs = Math.floor(fullDate.getTime() / 1000);

            if (!isNaN(unixTs)) {
                // Formatting as Full Date + Relative (e.g., "Friday... (in 2 hours)")
                timeString = `\n    CUANDO: <t:${unixTs}:F> (<t:${unixTs}:R>)`;
            }
        } catch (e) {
            console.warn('Error parsing date for AI prompt:', e);
        }
    }

    const prompt = `
    Actúa como un Community Manager experto en Gaming para una comunidad llamada "808 Activo".
    Genera un mensaje de anuncio CORTO, EMOCIONANTE y con EMOJIS para Discord sobre este nuevo evento:
    
    Título: ${eventData.title}
    Descripción: ${eventData.description}
    Sección: ${eventData.section}${timeString}

    Instrucciones Clave:
    1. El mensaje debe invitar a la gente a participar.
    2. Si hay un código de tiempo (como <t:12345:F>), CÓPIALO EXACTAMENTE igual en el mensaje. No intentes "traducirlo" a texto, Discord lo hará automáticamente.
    3. Máximo 3 líneas de texto. No uses hashtags.
    `;

    // Try Groq
    try {
        // 1. Fetch available models to find the latest valid one
        console.log('[AI] Fetching latest Groq models...');
        const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        let selectedModel = 'llama-3.3-70b-versatile'; // Default if fetch fails

        if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            const availableModels = modelsData.data.map(m => m.id);

            // Logic: Look for Llama 3 70B variants, preferring 'versatile'
            // or just pick the first one that matches 'llama-3'.
            // Groq usually has: llama-3.3-70b-versatile, llama-3.1-70b-versatile, etc.
            const bestMatch = availableModels.find(m => m.includes('llama-3') && m.includes('70b') && m.includes('versatile'))
                || availableModels.find(m => m.includes('llama-3') && m.includes('70b'))
                || availableModels.find(m => m.includes('llama-3'));

            if (bestMatch) {
                selectedModel = bestMatch;
                console.log(`[AI] Auto-selected model: ${selectedModel}`);
            }
        }

        console.log(`[AI] Using Groq (${selectedModel})...`);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: selectedModel,
                temperature: 0.7,
                max_tokens: 200
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();

    } catch (e) {
        console.warn('[AI] Groq failed:', e.message);
    }

    console.error('[AI] Groq failed or no content. Using fallback.');
    return `¡Nuevo evento: **${eventData.title}**! ${eventData.description}. ¡Participa ahora!`;
}
