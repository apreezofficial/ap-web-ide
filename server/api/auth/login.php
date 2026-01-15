<?php
// api/auth/login.php
require_once dirname(dirname(__DIR__)) . '/config/config.php';
require_once dirname(dirname(__DIR__)) . '/lib/Auth.php';

$auth = new Auth();
header('Location: ' . $auth->getLoginUrl());
exit;
