<?php
// api/github/repos.php
require_once __DIR__ . '/../../lib/Auth.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user = Auth::user();
$accessToken = $user['access_token'];

function githubRequest($url, $accessToken) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: token ' . $accessToken,
        'User-Agent: AP-IDE'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return null;
    }
    
    return json_decode($response, true);
}

try {
    // Fetch user's public and private repos (since we have 'repo' scope)
    $repos = githubRequest('https://api.github.com/user/repos?sort=updated&per_page=100', $accessToken);
    
    if ($repos === null) {
        throw new Exception("Failed to fetch repositories from GitHub");
    }
    
    echo json_encode(['repos' => $repos]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
