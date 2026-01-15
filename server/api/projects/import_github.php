<?php
// api/projects/import_github.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['clone_url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Project name and clone URL are required']);
    exit;
}

$user = Auth::user();
$projectLib = new Project($user['id']);

try {
    $projectId = $projectLib->importFromGithub($data['name'], $data['clone_url']);
    echo json_encode(['success' => true, 'id' => $projectId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
