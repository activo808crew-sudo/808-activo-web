<?php
// utils/jwt.php - Simple JWT Implementation

class JWT {
    private static $secret_key = '808secretkey'; // Hardcoded for simplicity on shared host, or load from config
    private static $algo = 'HS256';

    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algo]);
        $payload = json_encode($payload);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($token) {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) != 3) {
            return null;
        }

        $header = self::base64UrlDecode($tokenParts[0]);
        $payload = self::base64UrlDecode($tokenParts[1]);
        $signature_provided = $tokenParts[2];

        // Verify Signature
        $base64UrlHeader = $tokenParts[0];
        $base64UrlPayload = $tokenParts[1];
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        if ($base64UrlSignature === $signature_provided) {
            return json_decode($payload, true);
        }
        return null;
    }

    private static function base64UrlEncode($text) {
        return str_replace(
            ['+', '/', '='],
            ['-', '_', ''],
            base64_encode($text)
        );
    }

    private static function base64UrlDecode($text) {
        $url_safe = str_replace(
            ['-', '_'],
            ['+', '/'],
            $text
        );
        $padding = strlen($url_safe) % 4;
        if ($padding) {
            $url_safe .= str_repeat('=', 4 - $padding);
        }
        return base64_decode($url_safe);
    }
}
?>
