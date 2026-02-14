<?php
// api/projects/get.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$uuid = $_GET['id'] ?? null;

if (!$uuid) {
    http_response_code(400);
    echo json_encode(['error' => 'Project UUID required']);
    exit;
}

$user = Auth::user();
session_write_close();
$projectLib = new Project($user['id']);

try {
    $project = $projectLib->get($uuid);
    if (!$project) {
        http_response_code(404);
        echo json_encode(['error' => 'Project not found']);
        exit;
    }
    // Append full web path for convenience
    // Assuming assuming path is relative to server/storage/workspaces
    $webPath = "http://localhost/ap%20ai%20ide/server/storage/workspaces/" . $user['id'] . "/" . $project['path'];
    $project['web_url'] = $webPath;
    
    echo json_encode(['project' => $project]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
