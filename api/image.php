<?php
/**
 * Image Generation API Proxy
 * Handles AI image generation requests
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

// Get and validate prompt
$prompt = isset($_POST['prompt']) ? trim($_POST['prompt']) : '';

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Prompt is required for image generation'
    ]);
    exit();
}

// Sanitize prompt
$prompt = strip_tags($prompt);
$prompt = substr($prompt, 0, 500); // Limit prompt length

// Image generation API endpoint
$apiBaseUrl = 'https://image.pollinations.ai/prompt/';
$imageUrl = $apiBaseUrl . urlencode($prompt);

// Add parameters for better image quality
$params = [
    'width' => 1024,
    'height' => 1024,
    'nologo' => 'true',
    'seed' => rand(1, 999999)
];

// Build full URL with parameters
$fullUrl = $imageUrl . '?' . http_build_query($params);

// Validate image URL
$imageInfo = @getimagesize($fullUrl);

if ($imageInfo === false) {
    // Try without parameters
    $imageInfo = @getimagesize($imageUrl);
    
    if ($imageInfo === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to generate image. Please try a different prompt.'
        ]);
        exit();
    }
    
    $fullUrl = $imageUrl;
}

// Return success with image URL
echo json_encode([
    'success' => true,
    'imageUrl' => $fullUrl,
    'prompt' => $prompt,
    'width' => $imageInfo[0],
    'height' => $imageInfo[1],
    'mime' => $imageInfo['mime'],
    'timestamp' => date('c'),
    'seed' => $params['seed']
]);

// Log generation for analytics (optional)
// error_log("Image generated with prompt: " . $prompt);
?>