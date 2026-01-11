<?php
// api/auth/logout.php
require_once __DIR__ . '/../../lib/Auth.php';

Auth::logout();
header('Location: http://localhost:3000');
