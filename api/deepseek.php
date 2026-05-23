<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS (safe & standard)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/* -----------------------------
   Accept both GET and POST
------------------------------*/
$message = "";

// POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $message = $_POST['message'] ?? $_GET['message'] ?? '';
}

// GET request (for browser testing)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $message = $_GET['message'] ?? '';
}

// Block empty message
if (!$message) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Message is required'
    ]);
    exit();
}

/* -----------------------------
   API URL
------------------------------*/
$apiUrl = 'https://rumix-ai.vercel.app/api/chat/deepseek/v3?p=' . urlencode($message);

/* -----------------------------
   cURL request
------------------------------*/
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 60,

    // IMPORTANT FIX (stable on XAMPP)
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

/* -----------------------------
   cURL error handling
------------------------------*/
if ($curlError) {
    echo json_encode([
        'success' => false,
        'error' => 'cURL Error',
        'details' => $curlError
    ]);
    exit();
}

/* -----------------------------
   API failure handling
------------------------------*/
if ($httpCode !== 200 || !$response) {

    echo json_encode([
        'success' => false,
        'error' => 'API request failed',
        'status' => $httpCode
    ]);
    exit();
}

/* -----------------------------
   Parse response
------------------------------*/
$data = json_decode($response, true);

$content = $data['response']
        ?? $data['content']
        ?? $data['text']
        ?? $response;

/* -----------------------------
   Final output
------------------------------*/
echo json_encode([
    'success' => true,
    'model' => 'deepseek',
    'content' => $content,
    'raw' => $data
], JSON_UNESCAPED_UNICODE);
?>