import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ No GEMINI_API_KEY found in .env');
    process.exit(1);
}

console.log('🔍 Checking available models for your API Key...');
console.log(`🔑 Key: ${apiKey.substring(0, 5)}...`);

async function checkModels() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        if (data.error) {
            console.error('❌ API Error:', data.error);
            return;
        }

        if (!data.models) {
            console.log('⚠️ No models found.');
            return;
        }

        console.log('\n✅ Available Models:');
        data.models.forEach(m => {
            if (m.name.includes('gemini')) {
                console.log(`- ${m.name.replace('models/', '')} (${m.supportedGenerationMethods.join(', ')})`);
            }
        });

    } catch (e) {
        console.error('❌ Request failed:', e);
    }
}

checkModels();
