<?php
// api/terminal/stdin.php
require_once __DIR__ . '/../../lib/Auth.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['type' => 'error', 'data' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$processId = $data['process_id'] ?? '';
$input = $data['input'] ?? '';

if (!$processId) {
    http_response_code(400);
    echo json_encode(['type' => 'error', 'data' => 'Process ID is required']);
    exit;
}

$user = Auth::user();
$userId = $user['id'];
session_write_close();

// Stdin buffer file path
$bufferFile = sys_get_temp_dir() . "/ap_stdin_{$userId}_{$processId}.tmp";

if ($input !== '') {
    // Append input to the buffer file
    file_put_contents($bufferFile, $input, FILE_APPEND);
}

echo json_encode(['success' => true]);
