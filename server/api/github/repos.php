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
session_write_close();

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
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 20;
    
    $cacheKey = 'github_repos_' . $user['github_id'] . "_p{$page}_l{$perPage}";
    $cacheTime = $_SESSION['github_repos_time_' . $cacheKey] ?? 0;
    $forceRefresh = isset($_GET['refresh']);

    // Cache for 5 minutes (300 seconds)
    if (!$forceRefresh && isset($_SESSION[$cacheKey]) && (time() - $cacheTime < 300)) {
        echo json_encode(['repos' => $_SESSION[$cacheKey], 'cached' => true]);
        exit;
    }

    // Fetch user's public and private repos
    $repos = githubRequest("https://api.github.com/user/repos?sort=updated&page=$page&per_page=$perPage", $accessToken);
    
    if ($repos === null) {
        throw new Exception("Failed to fetch repositories from GitHub");
    }

    // Store in session cache
    $_SESSION[$cacheKey] = $repos;
    $_SESSION['github_repos_time_' . $cacheKey] = time();
    
    echo json_encode(['repos' => $repos, 'cached' => false]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
