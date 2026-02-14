<?php
// api/terminal/exec.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Project.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['type' => 'error', 'data' => 'Unauthorized']) . "\n";
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$command = $data['command'] ?? '';
$projectId = $data['project_id'] ?? null;

if (!$command) {
    echo json_encode(['output' => '']);
    exit;
}

// Function to check if a command exists across platforms
function command_exists($cmd) {
    // Whitelist common shell built-ins and Unix-like aliases (for PowerShell/Shell)
    $builtins = ['cd', 'mkdir', 'echo', 'dir', 'cls', 'rm', 'ls', 'cp', 'mv', 'set', 'export', 'exit', 'pwd', 'touch', 'npx'];
    if (in_array(strtolower($cmd), $builtins)) return true;

    $where = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? 'where' : 'which';
    $process = proc_open("$where " . escapeshellarg($cmd), [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes);
    if (is_resource($process)) {
        $out = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $return_value = proc_close($process);
        return $return_value === 0;
    }
    return false;
}

$user = Auth::user();
session_write_close();

// Ensure binaries are in PATH (Required for XAMPP/Windows to find php/node)
// We search across common drives for XAMPP
$path = getenv('PATH');
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $drives = ['C', 'D', 'E', 'F'];
    $extraPaths = [];
    foreach ($drives as $d) {
        if (is_dir("$d:\\xampp\\php")) $extraPaths[] = "$d:\\xampp\\php";
        if (is_dir("$d:\\xampp\\mysql\\bin")) $extraPaths[] = "$d:\\xampp\\mysql\\bin";
    }
    $extraPaths[] = 'C:\Program Files\nodejs';
    $extraPaths[] = getenv('ProgramFiles') . '\nodejs';
    
    $path = implode(';', array_unique(array_merge($extraPaths, explode(';', $path))));
    putenv("PATH=$path");
}

$cmdParts = explode(' ', trim($command));
$baseCmd = $cmdParts[0];

// Interceptor removed to allow manually answering questions

// Custom 'ap' Command Handling
if ($baseCmd === 'ap') {
    $subCmd = $cmdParts[1] ?? '';
    switch ($subCmd) {
        case '-v':
        case '--version':
            echo json_encode(['type' => 'output', 'data' => "AP IDE CLI \x1b[32mv1.0.0\x1b[0m\nSystem: " . PHP_OS . "\n"]) . "\n";
            exit;
        case '-help':
        case '--help':
            $docPath = __DIR__ . '/../../../commands.md';
            if (file_exists($docPath)) {
                $docs = file_get_contents($docPath);
                echo json_encode(['type' => 'output', 'data' => "\x1b[36mAP CLI Help Menu\x1b[0m\n\n" . $docs . "\n"]) . "\n";
            } else {
                echo json_encode(['type' => 'output', 'data' => "Help documentation not found.\n"]) . "\n";
            }
            exit;
        case 'install':
            $tool = $cmdParts[2] ?? '';
            if ($tool === 'php') {
                 // Try to find XAMPP PHP
                 $possiblePaths = [
                    'C:\\xampp\\php\\php.exe',
                    'D:\\xampp\\php\\php.exe',
                    'C:\\php\\php.exe'
                 ];
                 $found = null;
                 foreach ($possiblePaths as $p) {
                     if (file_exists($p)) {
                         $found = dirname($p);
                         break;
                     }
                 }
                 
                 if ($found) {
                     echo json_encode(['type' => 'output', 'data' => "[\x1b[34mAP-CLI\x1b[0m] Found PHP at \x1b[32m$found\x1b[0m.\n" .
                                                  "[\x1b[34mAP-CLI\x1b[0m] Automatically adding it to your IDE environment path...\n" .
                                                  "[\x1b[32mDONE\x1b[0m] PHP is now available in this terminal.\n"]) . "\n";
                 } else {
                     echo json_encode(['type' => 'output', 'data' => "[\x1b[31mAP-CLI\x1b[0m] Could not find PHP on your system.\n" .
                                                  "[\x1b[36mSuggestion\x1b[0m] Please install XAMPP or download PHP from https://windows.php.net/download/.\n"]) . "\n";
                 }
                 exit;
            }
            if ($tool === 'node' || $tool === 'npm') {
                 // Suggest NVM or direct installer
                 echo json_encode(['type' => 'output', 'data' => "[\x1b[34mAP-CLI\x1b[0m] Node.js setup guide:\n" .
                                              "  1. Download the installer from https://nodejs.org/\n" .
                                              "  2. Or use NVM for Windows: https://github.com/coreybutler/nvm-windows\n" .
                                              "[\x1b[33mTIP\x1b[0m] Once installed, restart the IDE to pick up the new PATH.\n"]) . "\n";
                 exit;
            }
            if ($tool === 'git') {
                 echo json_encode(['type' => 'output', 'data' => "[\x1b[34mAP-CLI\x1b[0m] Git setup guide:\n" .
                                              "  1. Download Git for Windows: https://git-scm.com/download/win\n" .
                                              "  2. Run the installer with default settings.\n" .
                                              "[\x1b[32mDONE\x1b[0m] Once Git is in your PATH, the IDE will automatically detect it.\n"]) . "\n";
                 exit;
            }
            if ($tool === 'composer') {
                 echo json_encode(['type' => 'output', 'data' => "[\x1b[34mAP-CLI\x1b[0m] Composer setup guide:\n" .
                                              "  1. Download composer-setup.php from https://getcomposer.org/download/\n" .
                                              "  2. Run 'php composer-setup.php' in your terminal.\n" .
                                              "  3. Follow instructions to add it to your PATH.\n" .
                                              "[\x1b[32mDONE\x1b[0m] Composer will enable PHP package management.\n"]) . "\n";
                 exit;
            }
            // Generic help for others
            echo json_encode(['type' => 'output', 'data' => "[\x1b[34mAP-CLI\x1b[0m] Installation guide for \x1b[32m$tool\x1b[0m:\n" .
                                         "  Please visit the official website for $tool to download the installer.\n" .
                                         "  Ensure 'Add to PATH' is checked during installation.\n"]) . "\n";
            exit;
        case 'status':
            $phpStatus = command_exists('php') ? "\x1b[32mOK\x1b[0m" : "\x1b[31mNot Found\x1b[0m";
            $nodeStatus = command_exists('node') ? "\x1b[32mOK\x1b[0m" : "\x1b[31mNot Found\x1b[0m";
            $gitStatus = command_exists('git') ? "\x1b[32mOK\x1b[0m" : "\x1b[31mNot Found\x1b[0m";
            echo json_encode(['type' => 'output', 'data' => "[\x1b[36mAP-STATUS\x1b[0m] System Diagnostics:\n" .
                                         "  PHP:   [$phpStatus]\n" .
                                         "  Node:  [$nodeStatus]\n" .
                                         "  Git:   [$gitStatus]\n"]) . "\n";
            exit;
        case 'clear':
            // Send ANSI clear sequence
            echo json_encode(['type' => 'output', 'data' => "\033[2J\033[H"]) . "\n";
            exit;
        default:
            echo json_encode(['type' => 'output', 'data' => "Unknown ap command: $subCmd. Use 'ap -help' for assistance.\n"]) . "\n";
            exit;
    }
}

// Block interactive commands that require TTY
$interactiveCmds = ['nano', 'vi', 'vim', 'less', 'more', 'top', 'htop', 'man', 'ssh'];
if (in_array($baseCmd, $interactiveCmds)) {
    echo json_encode(['type' => 'output', 'data' => "\x1b[33mWarning: Interactive command '$baseCmd' is not supported in this web terminal.\x1b[0m\nPlease use the file editor for editing files or run a non-interactive version if available.\n"]) . "\n";
    exit;
}

// Check if command exists (Skip check for common built-ins)
$builtins = ['cd', 'mkdir', 'echo', 'dir', 'cls', 'rm', 'ls', 'cp', 'mv', 'set', 'export', 'exit', 'pwd', 'touch', 'npx', 'npm', 'git', 'php', 'node', 'python'];
if (!in_array(strtolower($baseCmd), $builtins) && !command_exists($baseCmd)) {
    $suggestion = null;
    $output = "\x1b[31mError: Command '$baseCmd' not found.\x1b[0m\n";
    
    switch ($baseCmd) {
        case 'php':
            $suggestion = "PHP doesn't seem to be in your PATH.";
            break;
        case 'node':
        case 'npm':
            $suggestion = "Node.js/NPM not found.";
            break;
        case 'git':
            $suggestion = "Git not found.";
            break;
        case 'composer':
            $suggestion = "Composer not found. Visit https://getcomposer.org/doc/00-intro.md for installation instructions.";
            break;
    }
    
    if ($suggestion) {
        $output .= "\x1b[36mSuggestion: $suggestion\x1b[0m\n";
    }
    
    echo json_encode(['type' => 'output', 'data' => $output]) . "\n";
    exit;
}

// Special case for shells
if (($baseCmd === 'python' || $baseCmd === 'node' || $baseCmd === 'php') && count($cmdParts) === 1) {
     echo json_encode(['type' => 'output', 'data' => "\x1b[33mNotice: Interactive shells are not supported.\x1b[0m\nYou can run scripts (e.g., '$baseCmd script.js') or one-liners.\n"]) . "\n";
     exit;
}
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

// Increase execution time for long running commands
set_time_limit(0);

// Disable output buffering
ob_implicit_flush(true);
while (ob_get_level()) ob_end_clean();
header('Content-Type: application/x-ndjson'); // Newline delimited JSON
header('X-Accel-Buffering: no'); // Disable buffering on Nginx if present

// Generate a unique process ID for this terminal session
$processId = bin2hex(random_bytes(8));
$userId = $user['id'];
$bufferFile = sys_get_temp_dir() . "/ap_stdin_{$userId}_{$processId}.tmp";

// Ensure buffer file exists and is empty
if (file_exists($bufferFile)) unlink($bufferFile);
touch($bufferFile);

// Send Meta info immediately
echo json_encode(['type' => 'meta', 'process_id' => $processId]) . "\n";
if (ob_get_level() > 0) ob_flush();
flush();

// Execute command
$isWin = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

// On Windows, use Powershell to support common aliases like rm, ls, mkdir and better interactivity
if ($isWin) {
    // Normalize path for Windows and wrap in single quotes to handle spaces
    $safeCwd = str_replace("'", "''", $currentCwd);
    // Emulate 'touch' in PowerShell and set location
    $psSetup = "\$ErrorActionPreference = 'Stop'; 
                function touch(\$path) { New-Item -ItemType File -Path \$path -Force | Out-Null };
                Set-Location -LiteralPath '$safeCwd';";
    
    $cmdToRun = "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$psSetup " . str_replace('"', '\"', $command) . "\" 2>&1";
} else {
    $cmdToRun = "cd " . escapeshellarg($currentCwd) . " && " . $command . " 2>&1";
}

$descriptorspec = [
   0 => ["pipe", "r"], // stdin
   1 => ["pipe", "w"], // stdout
   2 => ["pipe", "w"]  // stderr
];

$process = proc_open($cmdToRun, $descriptorspec, $pipes);

if (is_resource($process)) {
    // Set pipes to non-blocking
    stream_set_blocking($pipes[1], 0);
    stream_set_blocking($pipes[2], 0);
    stream_set_blocking($pipes[0], 0);

    $lastOutputTime = time();

    while (true) {
        $read = [$pipes[1], $pipes[2]];
        $write = null;
        $except = null;
        
        // Lower timeout for better interactivity (50ms)
        $numChanged = stream_select($read, $write, $except, 0, 50000);

        if ($numChanged > 0) {
            foreach ($read as $pipe) {
                // Use fread instead of fgets to support partial lines (prompts)
                while ($s = fread($pipe, 8192)) {
                    $lastOutputTime = time();
                    echo json_encode(['type' => 'output', 'data' => $s]) . "\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }
            }
        }

        // Check for stdin input more frequently
        if (file_exists($bufferFile)) {
            $input = file_get_contents($bufferFile);
            if ($input !== false && $input !== '') {
                fwrite($pipes[0], $input);
                fflush($pipes[0]);
                file_put_contents($bufferFile, ''); // Clear
            }
        }

        $status = proc_get_status($process);
        if (!$status['running']) break;
        
        // Hang detection (extended to 60s for slow installs)
        if (time() - $lastOutputTime > 60) {
             // Just a pulse to keep connection alive
             echo json_encode(['type' => 'output', 'data' => '']) . "\n";
             if (ob_get_level() > 0) ob_flush();
             flush();
             $lastOutputTime = time();
        }
        
        usleep(10000); // 10ms nap to prevent CPU pegging
    }

    // Capture remaining output
    while ($s = fread($pipes[1], 8192)) { 
        echo json_encode(['type' => 'output', 'data' => $s]) . "\n"; 
        if (ob_get_level() > 0) ob_flush(); 
        flush(); 
    }
    while ($s = fread($pipes[2], 8192)) { 
        echo json_encode(['type' => 'output', 'data' => "\x1b[31m$s\x1b[0m"]) . "\n"; 
        if (ob_get_level() > 0) ob_flush(); 
        flush(); 
    }

    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $returnVar = proc_close($process);
    
    // Cleanup buffer file
    if (file_exists($bufferFile)) unlink($bufferFile);

    $finalCwd = $_SESSION['term_cwd'];
    $displayCwd = $finalCwd;

    if ($cwd) {
        if (strpos($finalCwd, $cwd) === 0) {
            $rel = substr($finalCwd, strlen($cwd));
            $displayCwd = '~' . ($rel ? str_replace('\\', '/', $rel) : '');
        }
    }

    echo json_encode([
        'type' => 'meta',
        'cwd' => $displayCwd,
        'user' => $user['username'],
        'exitCode' => $returnVar
    ]) . "\n";
    flush();
} else {
    echo json_encode(['type' => 'error', 'data' => "Failed to start process.\n"]) . "\n";
}
