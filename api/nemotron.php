<?php
/**
 * Nemotron API Proxy
 * Handles communication with Nemotron AI model
 */

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

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get parameters
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit();
}

// Nemotron API endpoint
$apiUrl = 'https://rumix-ai.vercel.app/api/chat/nemotron?p=' . urlencode($message);

// Initialize cURL
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 50,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'User-Agent: LuxAI/2.1.0'
    ]
]);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$info = curl_getinfo($ch);

curl_close($ch);

// Log error if any
if ($error) {
    error_log('Nemotron API Error: ' . $error);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to connect to Nemotron API',
        'details' => $error
    ]);
    exit();
}

// Handle non-200 responses
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => 'Nemotron API returned error',
        'status' => $httpCode,
        'response' => $response
    ]);
    exit();
}

// Process response
$data = json_decode($response, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    // Plain text response
    $result = [
        'success' => true,
        'model' => 'nemotron',
        'content' => $response,
        'timestamp' => date('c')
    ];
} else {
    // JSON response
    $content = $data['response'] ?? $data['content'] ?? $data['text'] ?? $data['message'] ?? '';
    
    $result = [
        'success' => true,
        'model' => 'nemotron',
        'content' => $content,
        'timestamp' => date('c'),
        'raw' => $data
    ];
}

// Ensure content is not empty
if (empty($result['content'])) {
    $result['content'] = 'No response from Nemotron. Please try again.';
    $result['warning'] = 'Empty response';
}

// Return response
echo json_encode($result, JSON_UNESCAPED_UNICODE);
?>