<?php
// api/auth/update_user.php
require_once __DIR__ . '/../../lib/Auth.php';
require_once __DIR__ . '/../../lib/Database.php';

header('Content-Type: application/json');

if (!Auth::check()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$db = Database::getInstance()->getConnection();
$user = Auth::user();

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? null;
$bio = $data['bio'] ?? null;

try {
    // Ensure columns exist (Auto-migration)
    // We'll wrap this in a try-catch to avoid failing if they already exist in some versions
    try {
        $db->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL");
    } catch (Exception $e) {}
    try {
        $db->exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL");
    } catch (Exception $e) {}

    $stmt = $db->prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?");
    $stmt->execute([$name, $bio, $user['id']]);

    // Clear session cache for user
    unset($_SESSION['cached_user']);

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
