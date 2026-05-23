<?php
/**
 * Copilot API Proxy
 * Handles communication with Copilot AI model
 */

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get message
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit();
}

// Copilot API endpoint
$apiUrl = 'https://rumix-ai.vercel.app/api/chat/copilot/smart?p=' . urlencode($message);

// Initialize cURL with error handling
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json, text/plain',
        'Cache-Control: no-cache',
        'User-Agent: LuxAI/2.1.0'
    ],
    CURLOPT_ENCODING => 'gzip, deflate'
]);

// Execute request
$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

// Handle connection errors
if ($error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Connection to Copilot API failed',
        'message' => $error
    ]);
    exit();
}

// Handle HTTP errors
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => 'Copilot API returned error',
        'status' => $httpCode
    ]);
    exit();
}

// Process successful response
$result = [
    'success' => true,
    'model' => 'copilot',
    'timestamp' => date('c')
];

// Try to parse as JSON
$jsonData = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE) {
    $result['content'] = $jsonData['response'] ?? $jsonData['content'] ?? $jsonData['message'] ?? '';
    $result['raw'] = $jsonData;
} else {
    // Use as plain text
    $result['content'] = $response;
}

// Ensure we have content
if (empty($result['content'])) {
    $result['content'] = 'No response from Copilot. Please try again.';
    $result['warning'] = 'Empty response received';
}

// Return response
echo json_encode($result);
?>