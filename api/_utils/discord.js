/**
 * Sends a message to a Discord Webhook
 * @param {string} webhookUrl - The Discord Webhook URL
 * @param {object} payload - The message payload (content, embeds, etc.)
 */
export async function sendDiscordWebhook(webhookUrl, payload) {
    if (!webhookUrl) {
        console.warn('[Discord] No webhook URL provided, skipping message.');
        return false;
    }

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error('[Discord] Webhook failed:', res.status, txt);
            return false;
        }

        return true;
    } catch (e) {
        console.error('[Discord] Error sending webhook:', e);
        return false;
    }
}

/**
 * Creates a standarized embed for 808 Announcements
 */
export function createEventEmbed({ title, description, image_url, color = 0x9333ea, url }) {
    return {
        title: title,
        description: description,
        url: url || 'https://808.lat',
        color: color, // Decimal color (e.g. Purple-600 is roughly 9646954)
        image: {
            url: image_url
        },
        footer: {
            text: '808 Activo • Eventos',
            icon_url: 'https://808.lat/logo.png' // Replace with actual logo if available
        },
        timestamp: new Date().toISOString()
    };
}
