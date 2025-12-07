<?php
// api_php/token.php (Twitch Token Proxy)
require_once 'cors.php';

// NOTE: Hardcoded fallback because user refused to fix .env security in previous steps (see token.js).
// Ideally these should come from ENV.
$CLIENT_ID = getenv('TWITCH_CLIENT_ID') ?: "5awflirnp3ns3gn0z627q66ot0pc0j";
$CLIENT_SECRET = getenv('TWITCH_CLIENT_SECRET') ?: "938ejrbuxwuqh1pz9fb2muo33lvyzk";

$tokenUrl = "https://id.twitch.tv/oauth2/token";
$params = [
    'client_id' => $CLIENT_ID,
    'client_secret' => $CLIENT_SECRET,
    'grant_type' => 'client_credentials'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener token']);
} else {
    // Return exactly what Twitch returns (access_token, expires_in, etc)
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
