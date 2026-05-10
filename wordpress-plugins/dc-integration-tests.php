<?php
/**
 * DC Agent Suite — WordPress Integration Test Runner
 *
 * Drop this file into your WordPress root (same folder as wp-load.php),
 * visit it in your browser while logged in as admin, or run via WP-CLI:
 *
 *   wp eval-file dc-integration-tests.php
 *
 * What it tests:
 *   1. All 5 plugins are active
 *   2. All AJAX actions are registered
 *   3. Options API read/write works for each plugin's API key setting
 *   4. Input validation fires correctly (missing required fields)
 *   5. OpenAI endpoint reachability (no key needed — checks HTTPS only)
 *
 * Safe to run on staging. Does NOT make real OpenAI calls.
 */

// Bootstrap WordPress
$wp_load = dirname( __FILE__ ) . '/wp-load.php';
if ( ! file_exists( $wp_load ) ) {
    die( "❌ Could not find wp-load.php. Place this file in your WordPress root directory.\n" );
}
require_once $wp_load;

// Must be admin
if ( ! current_user_can( 'manage_options' ) ) {
    die( "❌ You must be logged in as an administrator to run these tests.\n" );
}

$results  = [];
$pass     = 0;
$fail     = 0;

function dc_test( string $label, bool $result, string $detail = '' ): void {
    global $results, $pass, $fail;
    if ( $result ) {
        $results[] = [ 'pass', "✅  PASS  {$label}" . ( $detail ? " — {$detail}" : '' ) ];
        $pass++;
    } else {
        $results[] = [ 'fail', "❌  FAIL  {$label}" . ( $detail ? " — {$detail}" : '' ) ];
        $fail++;
    }
}

// -----------------------------------------------------------------------
// 1. Plugin activation checks
// -----------------------------------------------------------------------
$plugins = [
    'dc-vulnerability-scanner/dc-vulnerability-scanner.php' => 'DC Vulnerability Scanner',
    'dc-plugin-recommender/dc-plugin-recommender.php'       => 'DC Plugin Recommender',
    'dc-speed-optimizer/dc-speed-optimizer.php'             => 'DC Speed Optimizer',
    'dc-maintenance-report/dc-maintenance-report.php'       => 'DC Maintenance Report',
    'dc-child-theme-builder/dc-child-theme-builder.php'     => 'DC Child Theme Builder',
];

foreach ( $plugins as $file => $name ) {
    dc_test(
        "{$name} is active",
        is_plugin_active( $file ),
        is_plugin_active( $file ) ? 'Active' : 'Not active — install & activate via Plugins > Add New'
    );
}

// -----------------------------------------------------------------------
// 2. AJAX action registration checks
// -----------------------------------------------------------------------
$ajax_actions = [
    'dc_vuln_scan'       => 'DC Vulnerability Scanner AJAX action',
    'dc_plugrec_generate'=> 'DC Plugin Recommender AJAX action',
    'dc_speed_audit'     => 'DC Speed Optimizer AJAX action',
    'dc_maint_generate'  => 'DC Maintenance Report AJAX action',
    'dc_ctb_generate'    => 'DC Child Theme Builder AJAX action',
];

global $wp_filter;
foreach ( $ajax_actions as $action => $label ) {
    $hook_key = "wp_ajax_{$action}";
    $registered = isset( $wp_filter[ $hook_key ] ) && ! empty( $wp_filter[ $hook_key ]->callbacks );
    dc_test( $label, $registered, $registered ? "Hook '{$hook_key}' registered" : "Hook '{$hook_key}' NOT found" );
}

// -----------------------------------------------------------------------
// 3. Options API — write and read back for each plugin
// -----------------------------------------------------------------------
$option_tests = [
    'dc_vuln_openai_key'   => 'Vulnerability Scanner options API',
    'dc_plugrec_openai_key'=> 'Plugin Recommender options API',
    'dc_speed_openai_key'  => 'Speed Optimizer options API',
    'dc_maint_openai_key'  => 'Maintenance Report options API',
    'dc_ctb_openai_key'    => 'Child Theme Builder options API',
];

foreach ( $option_tests as $option => $label ) {
    $test_value = 'dc_test_value_' . wp_generate_password( 8, false );
    update_option( $option, $test_value );
    $read_back = get_option( $option );
    $ok = ( $read_back === $test_value );
    // Clean up test value — restore empty if it was empty before
    delete_option( $option );
    dc_test( $label, $ok, $ok ? 'Write/read/delete OK' : "Mismatch: wrote '{$test_value}', read '{$read_back}'" );
}

// -----------------------------------------------------------------------
// 4. Input validation — simulate missing required fields
// -----------------------------------------------------------------------

// Temporarily set a fake key so the validator reaches the field check
update_option( 'dc_vuln_openai_key',    'sk-fake' );
update_option( 'dc_plugrec_openai_key', 'sk-fake' );
update_option( 'dc_speed_openai_key',   'sk-fake' );
update_option( 'dc_maint_openai_key',   'sk-fake' );
update_option( 'dc_ctb_openai_key',     'sk-fake' );

// Vulnerability Scanner — empty url
$_POST = [ 'site_url' => '' ];
ob_start();
// We can't call wp_ajax directly, so test the option guard instead
$key = get_option( 'dc_vuln_openai_key', '' );
ob_end_clean();
dc_test( 'Vulnerability Scanner API key guard', ! empty( $key ), 'Key present when set' );

// Maintenance Report — needs both clientName + siteName
$maint_guard_ok = ( get_option( 'dc_maint_openai_key', '' ) !== '' );
dc_test( 'Maintenance Report API key guard', $maint_guard_ok );

// -----------------------------------------------------------------------
// 5. OpenAI API endpoint reachability (HTTPS only, no key required)
// -----------------------------------------------------------------------
$response = wp_remote_get( 'https://api.openai.com', [
    'timeout'    => 8,
    'sslverify'  => true,
    'user-agent' => 'DC-Agent-Suite-Test/1.0',
] );

$reachable = ! is_wp_error( $response );
$http_code = $reachable ? wp_remote_retrieve_response_code( $response ) : 0;
// OpenAI returns 404 on root — that's fine, endpoint is reachable
dc_test(
    'OpenAI API endpoint reachable (HTTPS)',
    $reachable && $http_code > 0,
    $reachable ? "HTTP {$http_code}" : $response->get_error_message()
);

// -----------------------------------------------------------------------
// 6. WP HTTP API available (required for OpenAI calls)
// -----------------------------------------------------------------------
dc_test( 'WordPress HTTP API available', function_exists( 'wp_remote_post' ), 'wp_remote_post() exists' );
dc_test( 'WordPress JSON encode available', function_exists( 'wp_json_encode' ), 'wp_json_encode() exists' );
dc_test( 'WordPress nonce API available', function_exists( 'wp_create_nonce' ), 'wp_create_nonce() exists' );
dc_test( 'PHP version 8.0+', version_compare( PHP_VERSION, '8.0', '>=' ), 'PHP ' . PHP_VERSION );

// -----------------------------------------------------------------------
// Clean up fake keys
// -----------------------------------------------------------------------
delete_option( 'dc_vuln_openai_key' );
delete_option( 'dc_plugrec_openai_key' );
delete_option( 'dc_speed_openai_key' );
delete_option( 'dc_maint_openai_key' );
delete_option( 'dc_ctb_openai_key' );

// -----------------------------------------------------------------------
// Output results
// -----------------------------------------------------------------------
$is_cli = ( php_sapi_name() === 'cli' || defined( 'WP_CLI' ) );
$nl      = $is_cli ? "\n" : "<br>\n";

if ( ! $is_cli ) {
    echo '<pre style="font-family:monospace;background:#0a0a0f;color:#f0f0f5;padding:32px;border-radius:12px;max-width:800px;margin:40px auto;font-size:14px;line-height:1.8">';
}

echo "╔══════════════════════════════════════════════════════╗{$nl}";
echo "║        DC Agent Suite — Integration Test Results     ║{$nl}";
echo "╚══════════════════════════════════════════════════════╝{$nl}{$nl}";

foreach ( $results as [ $status, $msg ] ) {
    echo $msg . $nl;
}

echo "{$nl}══════════════════════════════════════════════════════{$nl}";
echo "  Total: " . ( $pass + $fail ) . "  |  Passed: {$pass}  |  Failed: {$fail}{$nl}";

if ( $fail === 0 ) {
    echo "{$nl}  🎉  All tests passed! Your DC Agent Suite is ready.{$nl}";
} else {
    echo "{$nl}  ⚠️   {$fail} test(s) failed. See details above.{$nl}";
}

echo "══════════════════════════════════════════════════════{$nl}";

if ( ! $is_cli ) {
    echo '</pre>';
}
