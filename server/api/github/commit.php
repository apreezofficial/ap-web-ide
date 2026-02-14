<?php
// api/github/commit.php - Commit with optional backdating
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$projectId = $data['project_id'] ?? null;
$message = $data['message'] ?? 'Update from AP IDE';
$date = $data['date'] ?? null; // ISO format: 2026-01-18T09:00:00

if (!$projectId) {
    http_response_code(400);
    echo json_encode(['error' => 'Project ID required']);
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

// Auto-init git repository if not already initialized
if (!is_dir($projectPath . '/.git')) {
    $initCmd = "cd " . escapeshellarg($projectPath) . " && git init 2>&1";
    exec($initCmd, $initOutput, $initReturn);
    
    if ($initReturn !== 0) {
        echo json_encode(['error' => 'Failed to initialize git repository: ' . implode("\n", $initOutput)]);
        exit;
    }
    
    // Set default user config if not set globally
    $configCmd = "cd " . escapeshellarg($projectPath) . " && git config user.email \"user@apide.local\" && git config user.name \"AP IDE User\" 2>&1";
    exec($configCmd);
}

// Build commit command
$escapedMessage = escapeshellarg($message);
$cmd = "cd " . escapeshellarg($projectPath) . " && git add -A && ";

if ($date) {
    // Validate date format (basic check)
    if (strtotime($date) === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format. Use ISO format like 2026-01-18T09:00:00']);
        exit;
    }
    
    $escapedDate = escapeshellarg($date);
    
    // Set both author and committer date for consistency
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows PowerShell syntax
        $cmd .= "\$env:GIT_AUTHOR_DATE={$escapedDate}; \$env:GIT_COMMITTER_DATE={$escapedDate}; git commit -m {$escapedMessage}";
    } else {
        // Unix/Linux syntax
        $cmd .= "GIT_AUTHOR_DATE={$escapedDate} GIT_COMMITTER_DATE={$escapedDate} git commit -m {$escapedMessage}";
    }
} else {
    $cmd .= "git commit -m {$escapedMessage}";
}

$cmd .= " 2>&1";

exec($cmd, $output, $returnVar);
$outputStr = implode("\n", $output);

if ($returnVar !== 0 && strpos($outputStr, 'nothing to commit') === false) {
    echo json_encode([
        'success' => false,
        'error' => $outputStr ?: 'Commit failed'
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => strpos($outputStr, 'nothing to commit') !== false 
            ? 'Nothing to commit (working tree clean)' 
            : 'Committed successfully' . ($date ? " with date: $date" : ''),
        'output' => $outputStr
    ]);
}
