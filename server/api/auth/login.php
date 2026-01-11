<?php
// api/auth/login.php
require_once __DIR__ . '/../../lib/Auth.php';

$auth = new Auth();
header('Location: ' . $auth->getLoginUrl());
exit;
