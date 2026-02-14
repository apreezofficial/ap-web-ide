<?php
// lib/Auth.php
require_once __DIR__ . '/../config/config.php';

require_once __DIR__ . '/Database.php';

class Auth {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getLoginUrl() {

        $params = [
            'client_id' => GITHUB_CLIENT_ID,
            'redirect_uri' => GITHUB_REDIRECT_URI,
            'scope' => 'user:email repo',
            'state' => bin2hex(random_bytes(16))
        ];
        $_SESSION['oauth_state'] = $params['state'];
        return "https://github.com/login/oauth/authorize?" . http_build_query($params);
    }

    public function handleCallback($code, $state) {
        
        if ($state !== $_SESSION['oauth_state']) {
            throw new Exception("Invalid state");
        }

        $tokenResponse = $this->githubRequest('https://github.com/login/oauth/access_token', [
            'client_id' => GITHUB_CLIENT_ID,
            'client_secret' => GITHUB_CLIENT_SECRET,
            'code' => $code,
            'redirect_uri' => GITHUB_REDIRECT_URI
        ], ['Accept: application/json']);

        if (!isset($tokenResponse['access_token'])) {
            throw new Exception("Failed to get access token");
        }

        $accessToken = $tokenResponse['access_token'];
        $userData = $this->githubRequest('https://api.github.com/user', [], [
            'Authorization: token ' . $accessToken,
            'User-Agent: AP-IDE'
        ]);

        return $this->loginOrRegister($userData, $accessToken);
    }

    private function githubRequest($url, $params = [], $headers = []) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        if (!empty($params)) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    private function loginOrRegister($githubUser, $accessToken) {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE github_id = ?");
        $stmt->execute([$githubUser['id']]);
        $user = $stmt->fetch();

        if ($user) {
            $stmt = $this->db->prepare("UPDATE users SET access_token = ?, avatar_url = ? WHERE id = ?");
            $stmt->execute([$accessToken, $githubUser['avatar_url'], $user['id']]);
            $userId = $user['id'];
        } else {
            $stmt = $this->db->prepare("INSERT INTO users (github_id, username, email, avatar_url, access_token) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $githubUser['id'],
                $githubUser['login'],
                $githubUser['email'] ?? '',
                $githubUser['avatar_url'],
                $accessToken
            ]);
            $userId = $this->db->lastInsertId();
        }

        $_SESSION['user_id'] = $userId;
        return $userId;
    }

    public static function check() {
        return isset($_SESSION['user_id']);
    }

    public static function user() {
        if (!self::check()) return null;
        
        // Return cached user if available to save DB query
        if (isset($_SESSION['cached_user']) && $_SESSION['cached_user']['id'] == $_SESSION['user_id']) {
            return $_SESSION['cached_user'];
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Cache user in session
        $_SESSION['cached_user'] = $user;
        return $user;
    }

    public static function logout() {
        unset($_SESSION['cached_user']);
        session_destroy();
    }
}
