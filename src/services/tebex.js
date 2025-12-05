const PUBLIC_TOKEN = "10glv-bfd8bc3985ddf46f76ff9d4586b364e3e74c235d";
const BASE_URL = "https://headless.tebex.io/api";

export const TebexService = {
    /**
     * Fetch all categories and packages from the store.
     */
    getStoreListing: async () => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/${PUBLIC_TOKEN}/categories?includePackages=1`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`TebexService getStoreListing failed: ${response.status} ${errorText}`);
                throw new Error(`Failed to fetch store listing: ${response.status}`);
            }
            const json = await response.json();
            return json.data; // Array of categories
        } catch (error) {
            console.error("TebexService Error:", error);
            return [];
        }
    },

    /**
     * Create a basket for the user.
     * @param {string} returnUrl - URL to redirect after payment
     * @param {string} cancelUrl - URL to redirect if cancelled
     */
    createBasket: async (returnUrl, cancelUrl, username) => {
        try {
            const response = await fetch(`${BASE_URL}/accounts/${PUBLIC_TOKEN}/baskets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    complete_url: returnUrl,
                    cancel_url: cancelUrl,
                    username: username,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`TebexService createBasket failed: ${response.status} ${errorText}`);
                throw new Error(`Failed to create basket: ${response.status} ${errorText}`);
            }
            const json = await response.json();
            return json.data; // Basket object
        } catch (error) {
            console.error("TebexService Error:", error);
            throw error;
        }
    },

    /**
     * Add a package to the basket.
     * @param {string} basketIdent - The basket identifier
     * @param {number} packageId - The package ID to add
     */
    addToBasket: async (basketIdent, packageId) => {
        try {
            const response = await fetch(`${BASE_URL}/baskets/${basketIdent}/packages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    package_id: packageId,
                    quantity: 1,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`TebexService addToBasket failed: ${response.status} ${errorText}`);
                throw new Error(`Failed to add package to basket: ${response.status} ${errorText}`);
            }
            const json = await response.json();
            return json.data; // Updated basket
        } catch (error) {
            console.error("TebexService Error:", error);
            throw error;
        }
    },

    /**
     * Get the checkout URL for a basket.
     * @param {string} basketIdent 
     */
    getCheckoutUrl: async (basketIdent) => {
        // Usually the basket object already contains the checkout link in `links.checkout`
        // But we can also fetch it if needed.
        // For now, we rely on the createBasket/addToBasket response which should return links.
        return null;
    },

    /**
     * Get recent top donor.
     * Note: This uses a community endpoint which might not be available for all stores or might have CORS issues.
     * We return null if it fails so the UI can show a fallback.
     */
    getTopDonor: async () => {
        try {
            // This is a common endpoint for Tebex stores, but might vary.
            // If this fails, we might need a backend proxy.
            const response = await fetch("https://plugin.tebex.io/community/top_donators");
            if (!response.ok) return null;

            const json = await response.json();
            // Expected format: array of { ign, total }
            if (Array.isArray(json) && json.length > 0) {
                return json[0]; // Return the top one
            }
            return null;
        } catch (error) {
            console.warn("Failed to fetch top donor:", error);
            return null;
        }
    }
};
