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
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, name, path) VALUES (?, ?, ?)");
        $stmt->execute([$this->userId, $name, $safeName]);
        
        return $this->db->lastInsertId();
    }

    public function list() {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY last_accessed DESC");
        $stmt->execute([$this->userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function get($id) {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $this->userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function delete($id) {
        $project = $this->get($id);
        if (!$project) return false;
        
        $path = WORKSPACES_PATH . '/' . $this->userId . '/' . $project['path'];
        $this->deleteDir($path);
        
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ?");
        return $stmt->execute([$id]);
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
