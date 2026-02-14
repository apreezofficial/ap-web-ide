<?php
// api/files/read.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';
require_once __DIR__ . '/../../lib/FileSystem.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$projectId = $_GET['project_id'] ?? null;
$path = $_GET['path'] ?? null;

if (!$projectId || !$path) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID and Path required']);
    exit;
}

$user = Auth::user();
session_write_close();
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
    $content = $fs->readFile($path);
    echo json_encode(['content' => $content]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
