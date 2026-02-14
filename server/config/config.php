<?php
// config.php - Configuration for the AP IDE backend

define('DB_HOST', 'localhost');
define('DB_NAME', 'ap_ide');
define('DB_USER', 'root');
define('DB_PASS', '');

define('GITHUB_CLIENT_ID', 'Ov23liZ0vtDFtWpO8qso');
define('GITHUB_CLIENT_SECRET', 'f9c20e0ab5c077a1fe7ee4040dd58e44f42fa97f');
define('GITHUB_REDIRECT_URI', 'http://localhost:3000/api/auth/callback.php');

define('STORAGE_PATH', __DIR__ . '/../storage');
define('WORKSPACES_PATH', STORAGE_PATH . '/workspaces');

// Ensure directories exist (only if storage doesn't exist to save IO)
if (!is_dir(STORAGE_PATH)) {
    mkdir(STORAGE_PATH, 0777, true);
    mkdir(WORKSPACES_PATH, 0777, true);
    mkdir(STORAGE_PATH . '/sessions', 0777, true);
}
// For more robust but still fast checks, we could check if children exist only if storage exists.
// But for typical runtime, checking just STORAGE_PATH is 99% of the speedup.

// Error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    $sessionPath = STORAGE_PATH . '/sessions';
    if (!is_dir($sessionPath)) mkdir($sessionPath, 0777, true);
    ini_set('session.save_path', $sessionPath);
    session_start();
}
