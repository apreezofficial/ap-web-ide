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

    public function importFromGithub($name, $cloneUrl) {
        // Sanitize name to be filesystem safe
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
        $projectPath = WORKSPACES_PATH . '/' . $this->userId . '/' . $safeName;
        
        if (is_dir($projectPath)) {
            // If it exists, we might want to skip or overwrite. 
            // For now, let's append a timestamp if it exists.
            if (is_dir($projectPath)) {
               $safeName .= '_' . time();
               $projectPath = WORKSPACES_PATH . '/' . $this->userId . '/' . $safeName;
            }
        }

        // Create user workspace directory if not exists
        if (!is_dir(WORKSPACES_PATH . '/' . $this->userId)) {
            mkdir(WORKSPACES_PATH . '/' . $this->userId, 0777, true);
        }

        // Use git clone
        $user = Auth::user();
        $token = $user['access_token'];
        
        // Ensure we use the token correctly
        if (strpos($cloneUrl, 'https://github.com/') === 0) {
            $authCloneUrl = str_replace('https://github.com/', "https://$token@github.com/", $cloneUrl);
        } else {
            $authCloneUrl = $cloneUrl; // Fallback
        }
        
        $escapedCloneUrl = escapeshellarg($authCloneUrl);
        $escapedPath = escapeshellarg($projectPath);
        
        // Run git clone
        $command = "git clone $escapedCloneUrl $escapedPath 2>&1";
        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            // Cleanup directory on failure
            if (is_dir($projectPath)) {
                $this->deleteDir($projectPath);
            }
            
            // Scrub token from error message for security
            $errorMessage = str_replace($token, 'GITHUB_TOKEN', implode("\n", $output));
            
            // Log for debugging (optional, but good for "fr fr")
            error_log("Git clone failed: " . $errorMessage);
            
            throw new Exception("Failed to clone repository. Make sure the repo exists and is accessible. Error: " . $errorMessage);
        }

        // Save to DB
        $uuid = $this->generateUUID();
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, uuid, name, path, repo_url) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$this->userId, $uuid, $name, $safeName, $cloneUrl]);
        
        return $uuid;
    }

    public function list() {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY last_accessed DESC");
        $stmt->execute([$this->userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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

    private function deleteDir($dirPath) {
        if (!is_dir($dirPath)) return;
        $files = array_diff(scandir($dirPath), array('.', '..'));
        foreach ($files as $file) {
            (is_dir("$dirPath/$file")) ? $this->deleteDir("$dirPath/$file") : unlink("$dirPath/$file");
        }
        return rmdir($dirPath);
    }
}
