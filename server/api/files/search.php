<?php
// api/files/search.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$projectId = $_GET['project_id'] ?? null;
$query = $_GET['query'] ?? '';

if (!$projectId || !$query) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID and query required']);
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

$projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];

function searchFiles($dir, $query, $rootDir) {
    $results = [];
    $files = @scandir($dir);
    if ($files === false) return [];

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.git' || $file === 'node_modules' || $file === 'vendor') {
            continue;
        }

        $path = $dir . '/' . $file;
        $relativePath = str_replace($rootDir . '/', '', $path);

        if (is_dir($path)) {
            $results = array_merge($results, searchFiles($path, $query, $rootDir));
        } else {
            // Check if binary
            if (is_binary($path)) continue;

            $content = @file_get_contents($path);
            if ($content === false) continue;
            
            if (stripos($content, $query) !== false) {
                // Find all occurrences
                $lines = explode("\n", $content);
                foreach ($lines as $i => $line) {
                    if (stripos($line, $query) !== false) {
                        $results[] = [
                            'file' => $relativePath,
                            'line' => $i + 1,
                            'content' => trim(substr($line, 0, 200)) // Limit line length
                        ];
                        // Limit to 10 matches per file to avoid huge payloads
                        if (count($results) > 500) return $results; 
                    }
                }
            }
        }
    }
    return $results;
}

function is_binary($file) {
    if (file_exists($file)) {
        if (function_exists('mime_content_type')) {
            $mime = @mime_content_type($file);
            if ($mime) {
                 return (strpos($mime, 'text') === false && strpos($mime, 'json') === false && strpos($mime, 'xml') === false && strpos($mime, 'javascript') === false);
            }
        }
        // Fallback: check for null bytes
        $fh = @fopen($file, 'r');
        if ($fh) {
            $blk = fread($fh, 512);
            fclose($fh);
            return (strpos($blk, "\x00") !== false);
        }
    }
    return false;
}

try {
    $results = searchFiles($projectPath, $query, $projectPath);
    echo json_encode(['success' => true, 'results' => $results]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
