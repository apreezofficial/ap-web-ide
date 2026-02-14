<?php
// api/github/push.php
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

    // Configure git user if not set (optional but good practice)
    exec("cd " . escapeshellarg($projectPath) . " && git config user.name " . escapeshellarg($user['username']));
    exec("cd " . escapeshellarg($projectPath) . " && git config user.email " . escapeshellarg($user['email'] ?: 'user@example.com'));

    $output = [];
    $returnVar = 0;
    
    // Add, Commit, and Push
    $cmds = [
        "git add .",
        'git commit -m "Updated from AP IDE"',
        "git push origin main" // Fixed to push to main, maybe detect branch later?
    ];
    
    $fullCmd = "cd " . escapeshellarg($projectPath) . " && " . implode(" && ", $cmds);
    exec($fullCmd . " 2>&1", $output, $returnVar);

    if ($returnVar !== 0) {
        // Try master if main fails
        $cmds[2] = "git push origin master";
        $fullCmd = "cd " . escapeshellarg($projectPath) . " && " . implode(" && ", $cmds);
        exec($fullCmd . " 2>&1", $output, $returnVar);
    }

    if ($returnVar !== 0) {
        throw new Exception("Git Push failed: " . implode("\n", $output));
    }

    echo json_encode(['success' => true, 'output' => $output]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
