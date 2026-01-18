<?php
// api/terminal/exec.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$command = $data['command'] ?? '';
$projectId = $data['project_id'] ?? null;

if (!$command) {
    echo json_encode(['output' => '']);
    exit;
}

// Block interactive commands that require TTY
$interactiveCmds = ['nano', 'vi', 'vim', 'less', 'more', 'top', 'htop', 'man', 'ssh', 'python'];
$cmdParts = explode(' ', trim($command));
$baseCmd = $cmdParts[0];

if (in_array($baseCmd, $interactiveCmds)) {
    echo json_encode(['output' => "Error: Interactive command '$baseCmd' is not supported in this web terminal. Please use the file editor for editing files.\n"]);
    exit;
}
// Special case for python/node shells
if (($baseCmd === 'python' || $baseCmd === 'node' || $baseCmd === 'php') && count($cmdParts) === 1) {
     echo json_encode(['output' => "Error: Interactive shells are not supported. You can run scripts (e.g., 'python script.py') or one-liners.\n"]);
     exit;
}

// Basic security: Prevent simple abuse, but allow standard dev commands
// In a real generic IDE this needs sandboxing (Docker/microVM). 
// Since this is XAMPP/Local, we trust the authenticated user somewhat, but still...
// Block dangerous commands if possible, or just warn.
// For now, let's just run it.

$user = Auth::user();
$cwd = null;

if ($projectId) {
    $projectLib = new Project($user['id']);
    $project = $projectLib->get($projectId);
    if ($project) {
        $cwd = WORKSPACES_PATH . '/' . $user['id'] . '/' . $project['path'];
    }
}

// Session-based CWD for persistence
if (!isset($_SESSION['term_cwd'])) {
    $_SESSION['term_cwd'] = $cwd ?? getcwd();
}
// If project changed, reset cwd to project root? 
// Simplification: if project_id is passed, assume we want to be in project root context unless 'cd' happened?
// Let's stick to session cwd. If it's invalid, reset to project root.
if ($cwd && strpos($_SESSION['term_cwd'], $cwd) === false) {
     $_SESSION['term_cwd'] = $cwd;
}

$currentCwd = $_SESSION['term_cwd'];

// Handle CD command specifically
// Handle CD command specifically
if (preg_match('/^cd(?:\s+(.+))?$/', $command, $matches)) {
    $newPath = trim($matches[1] ?? '');
    
    if (!$newPath) {
        // cd with no args -> go to project root if known, else home?
        // Let's reset to initial project path if possible, or stay put?
        // Standard `cd` goes to HOME.
        // For this IDE context, maybe project root is better?
        // Let's go to Project Root if we know it.
        if ($cwd) {
             $_SESSION['term_cwd'] = $cwd;
             echo json_encode(['output' => '']);
             exit;
        }
        $newPath = '~'; // Fallback to expanding home below or just fail?
    }
    
    $targetPath = $newPath;
    
    // Simple tilde expansion
    if (strpos($newPath, '~') === 0) {
        // This is tricky in PHP cross-platform.
        // Let's just resolve relative to current.
    }
    
    $resolvedPath = realpath($currentCwd . '/' . $newPath);
    // Try absolute path
    if (!$resolvedPath && file_exists($newPath)) {
        $resolvedPath = realpath($newPath);
    }
    
    if ($resolvedPath && is_dir($resolvedPath)) {
        $_SESSION['term_cwd'] = $resolvedPath;
        echo json_encode(['output' => '']);
    } else {
        echo json_encode(['output' => "cd: no such file or directory: $newPath\n"]);
    }
    exit;
}

// Increase execution time for long running commands like npm install
set_time_limit(0);

// Ensure binaries are in PATH (Required for XAMPP/Windows to find php/node)
$path = getenv('PATH');
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $xamppPath = 'C:\xampp\php;C:\xampp\mysql\bin;C:\Program Files\nodejs'; 
    putenv("PATH=$xamppPath;$path");
}

// Execute command
// We append 2>&1 to capture stderr
// IMPORTANT: npm might need full path or environment variables. 
// For now, we rely on PATH being set correctly in XAMPP environment.
$cmdToRun = "cd " . escapeshellarg($currentCwd) . " && " . $command . " 2>&1";
exec($cmdToRun, $output, $returnVar);

$outputStr = implode("\n", $output);
// Add a newline if there is output
if ($outputStr !== '') {
    $outputStr .= "\n";
}

$finalCwd = $_SESSION['term_cwd'];
$displayCwd = $finalCwd;

// Try to make display CWD relative to project root for nicer prompt
// Re-fetch project to be safe or use session cached?
// We already fetched project above if projectId was passed.
if ($cwd) { // $cwd is the project root from above
    if (strpos($finalCwd, $cwd) === 0) {
        $rel = substr($finalCwd, strlen($cwd));
        $displayCwd = '~' . ($rel ? str_replace('\\', '/', $rel) : '');
    }
}

echo json_encode([
    'output' => $outputStr,
    'cwd' => $displayCwd,
    'user' => $user['username']
]);
