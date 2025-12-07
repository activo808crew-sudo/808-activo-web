import { generateAnnouncementText } from '../api/utils/ai.js';
import 'dotenv/config';

async function test() {
    console.log('--- Testing Dynamic Groq Model Selection ---');

    // Mock event data
    const event = {
        title: "Torneo de Prueba",
        description: "Un torneo épico para probar la IA.",
        section: "minecraft",
        start_date: new Date().toISOString(),
        start_time: "20:00"
    };

    const text = await generateAnnouncementText(event);
    console.log('\n--- Generated Text ---');
    console.log(text);
    console.log('----------------------');
}

test();
