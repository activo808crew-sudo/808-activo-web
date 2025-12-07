import { sendDiscordWebhook } from '../api/utils/discord.js';
import 'dotenv/config';

async function testStreamerNotification() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_STREAMERS;

    if (!webhookUrl) {
        console.error('❌ DISCORD_WEBHOOK_STREAMERS is not defined in .env');
        process.exit(1);
    }

    console.log('Sending test notification to:', webhookUrl);

    const mockUser = {
        display_name: 'StreamerDePrueba',
        login: 'testuser',
        profile_image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/asmongold-profile_image-f7dddfe5c1e1a504-300x300.png'
    };

    const mockStream = {
        title: '🔴 PRUEBA DE SISTEMA: Notificación de Directo',
        game_name: 'Just Chatting'
    };

    try {
        await sendDiscordWebhook(webhookUrl, {
            content: `<@&1310103738012074055> **${mockUser.display_name}** está en directo! 🔴\nhttps://twitch.tv/${mockUser.login}`,
            embeds: [{
                title: mockStream.title,
                description: `Jugando **${mockStream.game_name}**`,
                url: `https://twitch.tv/${mockUser.login}`,
                color: 0x9146FF,
                image: { url: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_asmongold-640x360.jpg' },
                thumbnail: { url: mockUser.profile_image_url },
                footer: { text: '808 Activo • TEST SYSTEM' },
                timestamp: new Date().toISOString()
            }]
        });
        console.log('✅ Test notification sent successfully!');
    } catch (e) {
        console.error('❌ Failed to send notification:', e);
    }
}

testStreamerNotification();
