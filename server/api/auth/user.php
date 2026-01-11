<?php
// api/auth/user.php
require_once __DIR__ . '/../../lib/Auth.php';

header('Content-Type: application/json');

if (Auth::check()) {
    echo json_encode(['authenticated' => true, 'user' => Auth::user()]);
} else {
    echo json_encode(['authenticated' => false]);
}
