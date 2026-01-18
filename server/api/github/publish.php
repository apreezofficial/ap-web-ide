<?php
// api/github/publish.php
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
$name = $data['name'] ?? null;
$description = $data['description'] ?? 'Created from AP AI IDE';
$private = isset($data['private']) ? (bool)$data['private'] : true;

if (!$uuid || !$name) {
    http_response_code(400);
    echo json_encode(['error' => 'Project UUID and name required']);
    exit;
}

$user = Auth::user();
$token = $user['access_token'];
$projectLib = new Project($user['id']);

try {
    $project = $projectLib->get($uuid);
    if (!$project) {
        throw new Exception("Project not found");
    }

    $projectPath = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    
    // 1. Create Repo on GitHub
    $ch = curl_init('https://api.github.com/user/repos');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'name' => $name,
        'description' => $description,
        'private' => $private,
        'auto_init' => false
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: token ' . $token,
        'User-Agent: AP-IDE',
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $repoData = json_decode($response, true);
    if ($httpCode >= 400) {
        throw new Exception("GitHub API Error: " . ($repoData['message'] ?? 'Unknown Error'));
    }
    
    $cloneUrl = $repoData['clone_url'];
    $authCloneUrl = str_replace('https://github.com/', "https://$token@github.com/", $cloneUrl);

    // 2. Initialize and Push Local Git
    if (!is_dir($projectPath . '/.git')) {
        exec("cd " . escapeshellarg($projectPath) . " && git init");
    }
    
    exec("cd " . escapeshellarg($projectPath) . " && git config user.name " . escapeshellarg($user['username']));
    exec("cd " . escapeshellarg($projectPath) . " && git config user.email " . escapeshellarg($user['email'] ?: 'user@example.com'));
    
    // Check if remote already exists
    $remotes = [];
    exec("cd " . escapeshellarg($projectPath) . " && git remote", $remotes);
    if (in_array('origin', $remotes)) {
        exec("cd " . escapeshellarg($projectPath) . " && git remote set-url origin " . escapeshellarg($authCloneUrl));
    } else {
        exec("cd " . escapeshellarg($projectPath) . " && git remote add origin " . escapeshellarg($authCloneUrl));
    }
    
    // Add, Commit, Push
    $cmds = [
        "git add .",
        "git commit -m 'Initial commit from AP AI IDE'",
        "git branch -M main",
        "git push -u origin main"
    ];
    
    $fullCmd = "cd " . escapeshellarg($projectPath) . " && " . implode(" && ", $cmds);
    exec($fullCmd . " 2>&1", $output, $returnVar);
    
    if ($returnVar !== 0) {
        $outputStr = implode("\n", $output);
        // Ignore "remote already exists" or "everything up-to-date" or "nothing to commit"
        // Also sometimes "git init" re-initialization isn't fatal.
        // If we have a repo_url, we considered it somewhat successful if we didn't completely bomb out before.
        // But specifically, if "failed to push" is the only real error we care about.
        
        // If output contains "error:" or "fatal:" that ISN'T "remote origin already exists"
        if ((strpos($outputStr, 'error:') !== false || strpos($outputStr, 'fatal:') !== false) && 
            strpos($outputStr, 'remote origin already exists') === false &&
            strpos($outputStr, 'nothing to commit') === false) {
             throw new Exception("Git Push failed: " . $outputStr);
        }
    }
    
    // 3. Update DB
    $db = Database::getInstance()->getConnection();
    $stmt = $db->prepare("UPDATE projects SET repo_url = ? WHERE uuid = ?");
    $stmt->execute([$cloneUrl, $uuid]);

    echo json_encode(['success' => true, 'repo_url' => $cloneUrl]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
