<?php
// api/github/commit.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$uuid = $data['project_id'] ?? null;
$message = $data['message'] ?? 'Updated from AP AI IDE';

if (!$uuid) {
    http_response_code(400);
    echo json_encode(['error' => 'Project UUID required']);
    exit;
}

$user = Auth::user();
$projectLib = new Project($user['id']);

try {
    $project = $projectLib->get($uuid);
    if (!$project) {
        throw new Exception("Project not found");
    }

    $projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    
    if (!is_dir($projectPath . '/.git')) {
        throw new Exception("Project is not a Git repository");
    }

    // Configure git user
    exec("cd " . escapeshellarg($projectPath) . " && git config user.name " . escapeshellarg($user['username']));
    exec("cd " . escapeshellarg($projectPath) . " && git config user.email " . escapeshellarg($user['email'] ?: 'user@example.com'));

    $output = [];
    $returnVar = 0;
    
    // Stage all changes and commit
    $command = "cd " . escapeshellarg($projectPath) . " && git add . && git commit -m " . escapeshellarg($message);
    exec($command . " 2>&1", $output, $returnVar);

    // If git commit fails with non-zero exit code
    if ($returnVar !== 0) {
        $outputStr = implode("\n", $output);
        // Check if it's just that there's nothing to commit
        if (strpos($outputStr, 'nothing to commit') !== false || strpos($outputStr, 'working tree clean') !== false) {
             // This is fine, just means no changes.
             // We can return success or a specific info message.
             echo json_encode(['success' => true, 'message' => 'Nothing to commit', 'output' => $output]);
             exit;
        } else {
             throw new Exception("Git Commit failed: " . $outputStr);
        }
    }

    echo json_encode(['success' => true, 'output' => $output]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
