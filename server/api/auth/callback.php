<?php
// api/auth/callback.php
require_once __DIR__ . '/../../lib/Auth.php';

$auth = new Auth();

try {
    if (!isset($_GET['code']) || !isset($_GET['state'])) {
        throw new Exception("Missing code or state");
    }
    
    $auth->handleCallback($_GET['code'], $_GET['state']);
    
    // Redirect to frontend dashboard
    header('Location: http://localhost:3000/dashboard');
} catch (Exception $e) {
    die("Authentication failed: " . $e->getMessage());
}
