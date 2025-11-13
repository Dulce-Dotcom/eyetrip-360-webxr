<?php
/**
 * SiteGround Cache Clearing Script
 * Access this file via browser to clear the cache
 */

// Security check - only allow from specific IPs or with a secret token
$secret_token = 'eyetrip2024clear'; // Change this to something secure
$provided_token = isset($_GET['token']) ? $_GET['token'] : '';

if ($provided_token !== $secret_token) {
    http_response_code(403);
    die('Access denied');
}

// Clear opcache if available
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache cleared<br>";
}

// Clear stat cache
clearstatcache(true);
echo "✅ Stat cache cleared<br>";

// Try to clear SiteGround's dynamic cache
if (function_exists('sg_cachepress_purge_cache')) {
    sg_cachepress_purge_cache();
    echo "✅ SiteGround dynamic cache cleared<br>";
} else {
    echo "⚠️ SiteGround cache function not available<br>";
}

// Force browser cache headers
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

echo "<br>🎉 Cache clearing completed!<br>";
echo "<br>Now refresh your site with Ctrl+F5 (or Cmd+Shift+R on Mac)";
?>
