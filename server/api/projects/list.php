<?php
// api/projects/list.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user = Auth::user();
$projectLib = new Project($user['id']);

try {
    $projects = $projectLib->list();
    echo json_encode(['projects' => $projects]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
