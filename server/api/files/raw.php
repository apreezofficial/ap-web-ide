<?php
// api/files/raw.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';
require_once __DIR__ . '/../../lib/FileSystem.php';

if (!Auth::check()) {
    http_response_code(401);
    die('Unauthorized');
}

$projectId = $_GET['project_id'] ?? null;
$path = $_GET['path'] ?? null;

if (!$projectId || !$path) {
    http_response_code(400);
    die('Project ID and Path required');
}

$user = Auth::user();
$projectLib = new Project($user['id']);
$project = $projectLib->get($projectId);

if (!$project) {
    http_response_code(404);
    die('Project not found');
}

try {
    $projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    $fs = new FileSystem($projectPath);
    $content = $fs->readFile($path);

    // Determine Content-Type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($content);
    
    // Explicit overrides for some types if needed
    $ext = pathinfo($path, PATHINFO_EXTENSION);
    if ($ext === 'css') $mimeType = 'text/css';
    if ($ext === 'js') $mimeType = 'application/javascript';
    if ($ext === 'svg') $mimeType = 'image/svg+xml';
    if ($ext === 'html') $mimeType = 'text/html';
    if ($ext === 'md') $mimeType = 'text/markdown';

    header('Content-Type: ' . $mimeType);
    echo $content;
} catch (Exception $e) {
    http_response_code(500);
    echo $e->getMessage();
}
