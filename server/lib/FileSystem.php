<?php
// lib/FileSystem.php

class FileSystem {
    private $rootPath;

    public function __construct($projectPath) {
        $this->rootPath = realpath($projectPath);
        if ($this->rootPath === false) {
            throw new Exception("Invalid project path");
        }
    }

    private function validatePath($path) {
        $realPath = realpath($this->rootPath . '/' . $path);
        if ($realPath === false || strpos($realPath, $this->rootPath) !== 0) {
            // Check if it's a new file creation inside root
            $dir = dirname($this->rootPath . '/' . $path);
            $realDir = realpath($dir);
            if ($realDir !== false && strpos($realDir, $this->rootPath) === 0) {
                return $this->rootPath . '/' . $path;
            }
            throw new Exception("Access denied: " . $path);
        }
        return $realPath;
    }

    public function list($path = '') {
        $targetPath = $this->validatePath($path);
        if (!is_dir($targetPath)) return [];

        $items = [];
        $files = scandir($targetPath);
        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;
            $fullPath = $targetPath . '/' . $f;
            $items[] = [
                'name' => $f,
                'path' => ($path ? $path . '/' : '') . $f,
                'type' => is_dir($fullPath) ? 'directory' : 'file'
            ];
        }
        return $items;
    }

    public function readFile($path) {
        $targetPath = $this->validatePath($path);
        if (!is_file($targetPath)) throw new Exception("File not found");
        return file_get_contents($targetPath);
    }

    public function writeFile($path, $content) {
        $targetPath = $this->validatePath($path);
        return file_put_contents($targetPath, $content);
    }

    public function delete($path) {
        $targetPath = $this->validatePath($path);
        if (is_dir($targetPath)) {
            return rmdir($targetPath);
        } else {
            return unlink($targetPath);
        }
    }

    public function createDirectory($path) {
        $targetPath = $this->validatePath($path);
        if (file_exists($targetPath)) throw new Exception("Directory already exists");
        return mkdir($targetPath, 0777, true);
    }
}
