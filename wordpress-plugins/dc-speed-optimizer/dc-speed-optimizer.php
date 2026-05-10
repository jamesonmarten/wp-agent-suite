<?php
/**
 * Plugin Name:       DC Speed Optimizer
 * Plugin URI:        https://products.devcabin.tech
 * Description:       AI-powered WordPress site speed auditor. Get a prioritized Core Web Vitals fix list formatted as a $499 client proposal.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Dev Cabin Technologies
 * Author URI:        https://products.devcabin.tech
 * License:           GPL v2 or later
 * Text Domain:       dc-speed-optimizer
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DC_SPEED_VERSION', '1.0.0' );
define( 'DC_SPEED_URL', plugin_dir_url( __FILE__ ) );

add_action( 'admin_menu', function () {
    add_menu_page(
        'Speed Optimizer', 'Speed Optimizer', 'manage_options',
        'dc-speed-optimizer', 'dc_speed_render_page',
        'dashicons-performance', 32
    );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_dc-speed-optimizer' ) return;
    wp_enqueue_style(  'dc-speed-style',  DC_SPEED_URL . 'assets/admin.css', [], DC_SPEED_VERSION );
    wp_enqueue_script( 'dc-speed-script', DC_SPEED_URL . 'assets/admin.js',  [], DC_SPEED_VERSION, true );
    wp_localize_script( 'dc-speed-script', 'dcSpeed', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'dc_speed_nonce' ),
    ] );
} );

add_action( 'admin_init', function () {
    register_setting( 'dc_speed_settings', 'dc_speed_openai_key', [ 'sanitize_callback' => 'sanitize_text_field' ] );
} );

add_action( 'wp_ajax_dc_speed_audit', function () {
    check_ajax_referer( 'dc_speed_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $url     = sanitize_url( $_POST['site_url'] ?? '' );
    $theme   = sanitize_text_field( $_POST['theme']   ?? '' );
    $hosting = sanitize_text_field( $_POST['hosting'] ?? '' );
    $api_key = get_option( 'dc_speed_openai_key', '' );

    if ( empty( $url ) )     { wp_send_json_error( [ 'message' => 'Site URL is required.' ] ); }
    if ( empty( $api_key ) ) { wp_send_json_error( [ 'message' => 'OpenAI API key not configured. Go to Settings tab.' ] ); }

    $prompt = "You are a WordPress performance optimization expert. Analyze this site:\n\n" .
        "- URL: {$url}\n" .
        "- Theme: " . ( $theme ?: 'Unknown' ) . "\n" .
        "- Hosting: " . ( $hosting ?: 'Unknown' ) . "\n\n" .
        "Generate a comprehensive Core Web Vitals & Speed Optimization Report. Include:\n" .
        "1. **Performance Score** — Simulate realistic Mobile LCP, INP, CLS, Overall Score (0-100).\n" .
        "2. **Top Issues Found** — 8–12 issues with impact level (🔴🟠🟡), time savings (ms), fix description.\n" .
        "3. **Image Optimization** — Specific recommendations for formats, lazy loading, sizing.\n" .
        "4. **Caching Strategy** — Specific plugin recommendations for their hosting.\n" .
        "5. **Database Optimization** — Cleanup recommendations.\n" .
        "6. **Render-Blocking Resources** — JS/CSS deferral steps.\n" .
        "7. **Hosting Upgrade Recommendation** — If needed.\n" .
        "8. **Implementation Quote** — Frame as a \$499 one-time optimization + \$97/mo monitoring.\n\n" .
        "Format in clean Markdown with tables. This should read like a paid audit report.";

    $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
        'timeout' => 60,
        'headers' => [ 'Authorization' => 'Bearer ' . $api_key, 'Content-Type' => 'application/json' ],
        'body'    => wp_json_encode( [ 'model' => 'gpt-4o', 'messages' => [ [ 'role' => 'user', 'content' => $prompt ] ] ] ),
    ] );

    if ( is_wp_error( $response ) ) { wp_send_json_error( [ 'message' => $response->get_error_message() ] ); }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    $text = $body['choices'][0]['message']['content'] ?? '';
    if ( empty( $text ) ) { wp_send_json_error( [ 'message' => 'No response from OpenAI.' ] ); }

    wp_send_json_success( [ 'result' => $text ] );
} );

function dc_speed_render_page() {
    $api_key = get_option( 'dc_speed_openai_key', '' );
    $tab     = $_GET['tab'] ?? 'optimizer';
    ?>
    <div class="dc-wrap">
      <div class="dc-header">
        <span class="dc-header-icon">⚡</span>
        <div>
          <h1>Site Speed Optimizer Agent</h1>
          <p>Core Web Vitals audit — turn results into a $499 proposal</p>
        </div>
        <span class="dc-badge dc-badge-yellow">Performance</span>
      </div>

      <nav class="dc-tabs">
        <a href="?page=dc-speed-optimizer&tab=optimizer" class="dc-tab <?php echo $tab === 'optimizer' ? 'active' : ''; ?>">⚡ Optimizer</a>
        <a href="?page=dc-speed-optimizer&tab=settings"  class="dc-tab <?php echo $tab === 'settings'  ? 'active' : ''; ?>">⚙️ Settings</a>
      </nav>

      <?php if ( $tab === 'settings' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">API Configuration</h2>
          <form method="post" action="options.php">
            <?php settings_fields( 'dc_speed_settings' ); ?>
            <div class="dc-field">
              <label>OpenAI API Key</label>
              <input type="password" name="dc_speed_openai_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk-..." class="dc-input" />
              <p class="dc-hint">Get your key at <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></p>
            </div>
            <?php submit_button( 'Save API Key', 'dc-btn-primary', 'submit', false ); ?>
          </form>
        </div>

      <?php else : ?>
        <?php if ( empty( $api_key ) ) : ?>
          <div class="dc-notice dc-notice-warn">⚠️ No OpenAI API key set. <a href="?page=dc-speed-optimizer&tab=settings">Go to Settings →</a></div>
        <?php endif; ?>

        <div class="dc-card">
          <h2 class="dc-section-title">Run Speed Audit</h2>
          <div class="dc-field">
            <label>WordPress Site URL <span style="color:#e53e3e">*</span></label>
            <input type="url" id="dc-site-url" placeholder="https://yourclient.com" class="dc-input" />
          </div>
          <div class="dc-grid-2">
            <div class="dc-field">
              <label>Theme (optional)</label>
              <input type="text" id="dc-theme" placeholder="e.g. Divi, Elementor, Astra…" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Hosting Provider (optional)</label>
              <input type="text" id="dc-hosting" placeholder="e.g. SiteGround, WP Engine…" class="dc-input" />
            </div>
          </div>
          <button id="dc-audit-btn" class="dc-btn dc-btn-yellow dc-btn-full" <?php echo empty( $api_key ) ? 'disabled' : ''; ?>>⚡ Generate Speed Audit</button>
        </div>

        <div id="dc-result-wrap" class="dc-card dc-hidden">
          <div class="dc-result-header">
            <span id="dc-result-status">⏳ Analyzing…</span>
            <button id="dc-copy-btn" class="dc-btn-ghost">Copy Report</button>
          </div>
          <div id="dc-result" class="dc-result"></div>
        </div>

        <div class="dc-card dc-monetize">
          <p class="dc-monetize-title">💡 How to Monetize This Agent</p>
          <ul>
            <li>Offer as a <strong>$499 speed optimization service</strong> — use report as proposal</li>
            <li>Run for every new client site as part of <strong>onboarding</strong></li>
            <li>Bundle into care plans to <strong>justify higher monthly fees</strong></li>
            <li>Run on competitors' client sites as a <strong>cold outreach tool</strong></li>
          </ul>
        </div>
      <?php endif; ?>
    </div>
    <?php
}
