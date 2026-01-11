<?php
// api/projects/delete.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID is required']);
    exit;
}

$user = Auth::user();
$projectLib = new Project($user['id']);

try {
    $success = $projectLib->delete($data['id']);
    echo json_encode(['success' => $success]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
