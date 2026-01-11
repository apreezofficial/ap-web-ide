<?php
// api/files/write.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';
require_once __DIR__ . '/../../lib/FileSystem.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$projectId = $data['project_id'] ?? null;
$path = $data['path'] ?? null;
$content = $data['content'] ?? '';

if (!$projectId || !$path) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID and Path required']);
    exit;
}

$user = Auth::user();
$projectLib = new Project($user['id']);
$project = $projectLib->get($projectId);

if (!$project) {
    http_response_code(404);
    echo json_encode(['error' => 'Project not found']);
    exit;
}

try {
    $projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    $fs = new FileSystem($projectPath);
    $fs->writeFile($path, $content);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
