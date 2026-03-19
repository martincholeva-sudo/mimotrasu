<?php
// Vypnout chyby
error_reporting(0);
header('Location: /dekujeme.html'); // stránka s poděkováním

// Pokud není POST, konec
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

$email = $_POST['fields']['email'] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit;
}

// API klíč a skupina
$apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiN2MxZjNkODg5MmU1ZThiOGZiNDljODI1N2Y5MzVhMzgxYTIyYTQyNmM0MmM3NjlmOGM3MjE5ZjQ3MTEwNDIyNGIyNDRhOTE4ZDcyMjQ1ZjgiLCJpYXQiOjE3NTMzMzU5OTIuMjcyMTI5LCJuYmYiOjE3NTMzMzU5OTIuMjcyMTMyLCJleHAiOjQ5MDkwMDk1OTIuMjY1NzA3LCJzdWIiOiIxNTEyNzU1Iiwic2NvcGVzIjpbXX0.QLVaBq4y7pjMVF1fkIyG8hU6UtEZAMGmJ_yIZMnESi5XqS4IPfXOU3OIV8jBmAQ_YidyW75KF7R9EsQq-6eWhnAxpnDa0oE8KFLwEwQUH_UKTarTMEzzGoNKBF6qTrMQp661N8jkLVugzMFAQ_9MA0_5bIFyX4_lVXIQZnVgIYfjQ3u6J9Bd6UdpAEHmnYjg0AXm6MotcVE39C11x1A-hH8yCIJMmdys97g5t5yMy7AWc9N6RUNqfpnleDrJsaFMslXGQE-qtiich2se8CYSpMnnen6L9d0msiKBNwidAIkjtSvrnGFywy5DQbQN6bwgHPzFkknB_NI3pfxtpfsLSJnqrrSHAstQEtEr3QXFtlewpdXrVEEN8uF4nFO2-OHhdAs07cR2_9JkqUfofysr18smJq39sfsiKsyD5q3sfu99X7_QvbesA-U9ApMVLcPNsCSHL82e2MUHSBWwDu7dymp1p3qb8SbvZ0yaiestsToGtZkU7jsVC4N53HTbpR4hfsXnf0wTcr_zPXxW6DO7H0BYVjC4W-CfguR2b-YqOcwdR4B_9mnhFWu0QtX8I0qkDoV7BbDfOtmS77HWzQVCOU-f3D1S4oNMIouM4jwbfQNqknkulah6va-YBD9y0OdLLv2K5E9QVGxC45bCZ8ResCmo71U6axfqKhQRbJBzqBY';
$groupId = '153577456115123431';

// Pošli na MailerLite API
$ch = curl_init('https://connect.mailerlite.com/api/subscribers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => $email,
    'groups' => [$groupId]
]));
curl_exec($ch);
curl_close($ch);


