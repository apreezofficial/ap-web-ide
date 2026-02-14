<?php
// api/auth/user.php
require_once __DIR__ . '/../../lib/Auth.php';

header('Content-Type: application/json');

if (Auth::check()) {
    $user = Auth::user();
    session_write_close();
    echo json_encode(['authenticated' => true, 'user' => $user]);
} else {
    session_write_close();
    echo json_encode(['authenticated' => false]);
}
