<?php
// lib/Project.php

class Project {
    private $db;
    private $userId;

    public function __construct($userId) {
        require_once __DIR__ . '/Database.php';
        require_once __DIR__ . '/../config/config.php';
        $this->db = Database::getInstance()->getConnection();
        $this->userId = $userId;
    }

    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    public function create($name, $template = 'blank') {
        // Sanitize name to be filesystem safe
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
        $projectPath = WORKSPACES_PATH . '/' . $this->userId . '/' . $safeName;
        
        if (is_dir($projectPath)) {
            throw new Exception("Project already exists");
        }
        
        // Create directory
        if (!mkdir($projectPath, 0777, true)) {
            throw new Exception("Failed to create project directory");
        }

        // Initialize template
        if ($template === 'node') {
            file_put_contents($projectPath . '/package.json', '{"name": "'.$safeName.'", "version": "1.0.0"}');
            file_put_contents($projectPath . '/index.js', 'console.log("Hello World");');
        } elseif ($template === 'php') {
            file_put_contents($projectPath . '/index.php', '<?php echo "Hello World"; ?>');
        } else {
            file_put_contents($projectPath . '/README.md', '# ' . $name);
        }

        // Save to DB
        $uuid = $this->generateUUID();
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, uuid, name, path) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->userId, $uuid, $name, $safeName]);
        
        return $uuid;
    }

    public function list($limit = null, $offset = 0) {
        $userPath = WORKSPACES_PATH . '/' . $this->userId;
        
        // Fetch all tracked paths in one query
        $stmt = $this->db->prepare("SELECT path FROM projects WHERE user_id = ?");
        $stmt->execute([$this->userId]);
        $trackedPaths = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (is_dir($userPath)) {
            $folders = array_diff(scandir($userPath), array('.', '..'));
            foreach ($folders as $folder) {
                if (is_dir($userPath . '/' . $folder) && !in_array($folder, $trackedPaths)) {
                    // Auto-import only if it's not already tracked
                    $uuid = $this->generateUUID();
                    $stmt = $this->db->prepare("INSERT INTO projects (user_id, uuid, name, path) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$this->userId, $uuid, $folder, $folder]);
                }
            }
        }

        $query = "SELECT * FROM projects WHERE user_id = ? ORDER BY last_accessed DESC";
        
        if ($limit !== null) {
            // Use direct injection for LIMIT/OFFSET since PDO execute() quotes everything as strings,
            // which causes a syntax error in some MariaDB/MySQL configurations.
            $query .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count() {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM projects WHERE user_id = ?");
        $stmt->execute([$this->userId]);
        return (int)$stmt->fetchColumn();
    }

    public function importFromGithub($name, $cloneUrl) {
        // Sanitize name to be filesystem safe
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
        $userPath = WORKSPACES_PATH . '/' . $this->userId;
        $projectPath = $userPath . '/' . $safeName;
        
        // Create user workspace directory if not exists
        if (!is_dir($userPath)) {
            mkdir($userPath, 0777, true);
        }

        if (is_dir($projectPath)) {
             $safeName .= '_' . time();
             $projectPath = $userPath . '/' . $safeName;
        }

        // Use git clone
        $user = Auth::user();
        $token = $user['access_token'] ?? '';
        
        // Ensure we use the token correctly
        if ($token && (strpos($cloneUrl, 'https://github.com/') === 0)) {
            $authCloneUrl = str_replace('https://github.com/', "https://$token@github.com/", $cloneUrl);
        } else {
            $authCloneUrl = $cloneUrl;
        }

        // Find git binary if not in PATH
        $gitCmd = 'git';
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $possibleGitPaths = [
                'C:\Program Files\Git\bin\git.exe',
                'C:\Program Files (x86)\Git\bin\git.exe',
                'D:\Program Files\Git\bin\git.exe',
                'C:\xampp\git\bin\git.exe'
            ];
            foreach ($possibleGitPaths as $p) {
                if (file_exists($p)) {
                    $gitCmd = escapeshellarg($p);
                    break;
                }
            }
        }
        
        $escapedCloneUrl = escapeshellarg($authCloneUrl);
        $escapedPath = escapeshellarg($projectPath);
        
        // Ensure some common dirs are in PATH for internal git operations
        $envPath = getenv('PATH');
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' && strpos($envPath, 'C:\Windows\System32') === false) {
             $envPath .= ';C:\Windows\System32;C:\Windows\SysWOW64';
             putenv("PATH=$envPath");
        }

        $command = "$gitCmd clone $escapedCloneUrl $escapedPath 2>&1";
        
        // Capture output for detailed error reporting
        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            if (is_dir($projectPath)) {
                $this->deleteDir($projectPath);
            }
            
            $errorMessage = implode("\n", $output);
            if ($token) {
                $errorMessage = str_replace($token, 'GITHUB_TOKEN', $errorMessage);
            }
            
            error_log("Git clone failed for user {$this->userId}: " . $errorMessage);
            throw new Exception("Failed to clone repository. Error: " . ($errorMessage ?: "Unknown error (code $returnVar)"));
        }

        // Verify it was actually created
        if (!is_dir($projectPath)) {
            throw new Exception("Cloning finished but directory was not created.");
        }

        // Save to DB
        $uuid = $this->generateUUID();
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, uuid, name, path, repo_url) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$this->userId, $uuid, $name, $safeName, $cloneUrl]);
        
        return $uuid;
    }
    
    public function get($uuid) {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE uuid = ? AND user_id = ?");
        $stmt->execute([$uuid, $this->userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function delete($uuid) {
        $project = $this->get($uuid);
        if (!$project) return false;
        
        $path = WORKSPACES_PATH . '/' . $this->userId . '/' . $project['path'];
        $this->deleteDir($path);
        
        $stmt = $this->db->prepare("DELETE FROM projects WHERE uuid = ?");
        return $stmt->execute([$uuid]);
    }

    public function clearAll() {
        $stmt = $this->db->prepare("SELECT uuid FROM projects WHERE user_id = ?");
        $stmt->execute([$this->userId]);
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($projects as $project) {
            $this->delete($project['uuid']);
        }
        
        // Also cleanup workspace dir if anything left
        $userPath = WORKSPACES_PATH . '/' . $this->userId;
        if (is_dir($userPath)) {
            $this->deleteDir($userPath);
        }
        
        return true;
    }

    private function deleteDir($dirPath) {
        if (!is_dir($dirPath)) return;
        $files = array_diff(scandir($dirPath), array('.', '..'));
        foreach ($files as $file) {
            (is_dir("$dirPath/$file")) ? $this->deleteDir("$dirPath/$file") : unlink("$dirPath/$file");
        }
        return rmdir($dirPath);
    }
}
