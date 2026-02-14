<?php
// api/github/status.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$uuid = $_GET['project_id'] ?? null;

if (!$uuid) {
    http_response_code(400);
    echo json_encode(['error' => 'Project UUID required']);
    exit;
}

$user = Auth::user();
session_write_close();
$projectLib = new Project($user['id']);

try {
    $project = $projectLib->get($uuid);
    if (!$project) {
        throw new Exception("Project not found");
    }

    $projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    
    if (!is_dir($projectPath . '/.git')) {
        echo json_encode(['success' => true, 'is_git' => false, 'changes' => []]);
        exit;
    }

    $output = [];
    $returnVar = 0;
    
    // Get status porcelain
    $command = "cd " . escapeshellarg($projectPath) . " && git status --porcelain";
    exec($command, $output, $returnVar);

    $changes = [];
    foreach ($output as $line) {
        $status = substr($line, 0, 2);
        $file = trim(substr($line, 3));
        
        $changes[] = [
            'file' => $file,
            'status' => $status, // e.g., ' M', 'A ', '??', ' D'
        ];
    }

    // Also get current branch
    $branch = 'unknown';
    $branchOutput = [];
    exec("cd " . escapeshellarg($projectPath) . " && git rev-parse --abbrev-ref HEAD", $branchOutput);
    if (!empty($branchOutput)) {
        $branch = trim($branchOutput[0]);
    }

    echo json_encode([
        'success' => true, 
        'is_git' => true, 
        'branch' => $branch,
        'changes' => $changes
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
