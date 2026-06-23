<?php

$json_file = 'service-account.json';


if (!file_exists($json_file)) {
    die("Error: service-account.json file not found!");
}
$data = json_decode(file_get_contents($json_file), true);
$project_id = $data['project_id'];


function get_google_access_token($data) {
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $now = time();
    $payload = json_encode([
        'iss' => $data['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $now + 3600,
        'iat' => $now
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = '';
    openssl_sign($base64UrlHeader . "." . $base64UrlPayload, $signature, $data['private_key'], 'SHA256');
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]));
    $response = curl_exec($ch);
    curl_close($ch);

    $res_data = json_decode($response, true);
    return $res_data['access_token'];
}


function send_v1_notification($token, $access_token, $project_id, $streak) {
    $url = "https://fcm.googleapis.com/v1/projects/$project_id/messages:send";
    
    $message = [
        "message" => [
            "token" => $token,
            "notification" => [
               "title" => "🎁 Your $streak day streak is at risk!",
                "body" => "You haven't claimed your reward yet. Play a quiz now to save your streak!"
            ]
        ]
    ];

    $headers = [
        'Authorization: Bearer ' . $access_token,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}


define('FIREBASE_DB_URL', 'https://webforquiz-default-rtdb.firebaseio.com/');

function get_from_db($path) {
    $res = file_get_contents(FIREBASE_DB_URL . $path . '.json');
    return json_decode($res, true);
}

$access_token = get_google_access_token($data);
$all_tokens = get_from_db('fcm_tokens');
$reminders = get_from_db('streak_reminders');

if ($reminders && $all_tokens) {
    foreach ($reminders as $uid => $rem) {
        if (isset($all_tokens[$uid]['token'])) {
            $user_token = $all_tokens[$uid]['token'];
            $res = send_v1_notification($user_token, $access_token, $project_id, $rem['streak']);
            echo "Sent to $uid: $res <br>";
        }
    }
}
?>