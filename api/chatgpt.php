<?php
/**
 * ChatGPT API Proxy
 * Handles communication with ChatGPT AI model
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// Security headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

// Get and sanitize input
$message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';
$history = isset($_POST['history']) ? $_POST['history'] : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message parameter is required']);
    exit();
}

// Validate message length
if (strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message too long. Maximum 5000 characters allowed.']);
    exit();
}

// ChatGPT API endpoint
$apiUrl = 'https://rumix-ai.vercel.app/api/chat/chatgpt?p=' . urlencode($message);

// Configure cURL
$ch = curl_init();

$curlOptions = [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Accept-Language: en-US,en;q=0.9',
        'Cache-Control: no-cache',
        'User-Agent: LuxAI/2.1.0'
    ],
    CURLOPT_ENCODING => '',
    CURLOPT_VERBOSE => false,
    CURLOPT_HEADER => false
];

curl_setopt_array($ch, $curlOptions);

// Execute with retry logic
$maxRetries = 2;
$retryCount = 0;
$response = false;

while ($retryCount <= $maxRetries) {
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    if ($curlError) {
        $retryCount++;
        if ($retryCount <= $maxRetries) {
            sleep(1);
            continue;
        }
        break;
    }
    
    if ($httpCode === 200) {
        break;
    }
    
    $retryCount++;
    if ($retryCount <= $maxRetries) {
        sleep(1);
    }
}

curl_close($ch);

// Handle final errors
if ($curlError || !$response) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to communicate with ChatGPT API',
        'details' => $curlError ?: 'No response received'
    ]);
    exit();
}

// Process response
$responseData = json_decode($response, true);

if (json_last_error() === JSON_ERROR_NONE) {
    // JSON response
    $content = $responseData['response'] ?? 
               $responseData['content'] ?? 
               $responseData['choices'][0]['message']['content'] ?? 
               $responseData['text'] ?? 
               $response;
               
    $responsePayload = [
        'success' => true,
        'model' => 'chatgpt',
        'content' => $content,
        'timestamp' => date('c')
    ];
    
    // Include additional metadata if available
    if (isset($responseData['usage'])) {
        $responsePayload['usage'] = $responseData['usage'];
    }
    
    if (isset($responseData['id'])) {
        $responsePayload['response_id'] = $responseData['id'];
    }
} else {
    // Plain text response
    $responsePayload = [
        'success' => true,
        'model' => 'chatgpt',
        'content' => $response,
        'timestamp' => date('c')
    ];
}

// Log response for debugging (optional)
// error_log('ChatGPT Response: ' . json_encode($responsePayload));

echo json_encode($responsePayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>