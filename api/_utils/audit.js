export async function logAction(connection, userId, action, details, ip) {
    try {
        await connection.query(
            `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
            [userId, action, JSON.stringify(details), ip]
        );
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Don't fail the main request just because logging failed, usually.
        // But depends on strictness. For now, just log error.
    }
}
