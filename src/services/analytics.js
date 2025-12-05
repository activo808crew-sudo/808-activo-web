export const AnalyticsService = {
    async trackLogin(username) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'login',
                    data: { username }
                })
            });
        } catch (err) {
            console.error('Failed to track login:', err);
        }
    },

    async trackEvent(username, eventType, item) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'event',
                    data: {
                        username,
                        event_type: eventType,
                        item_id: item.id,
                        item_name: item.name,
                        item_price: item.total_price
                    }
                })
            });
        } catch (err) {
            console.error('Failed to track event:', err);
        }
    },

    async getFeaturedItems() {
        try {
            const res = await fetch('/api/analytics');
            if (!res.ok) return [];
            const json = await res.json();
            return json.featured || [];
        } catch (err) {
            console.error('Failed to get featured items:', err);
            return [];
        }
    }
};
