<?php
/**
 * Plugin Name:       DC Plugin Recommender
 * Plugin URI:        https://products.devcabin.tech
 * Description:       AI-powered WordPress plugin stack recommender. Describe any business and get a curated, conflict-checked plugin stack with an implementation quote.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Dev Cabin Technologies
 * Author URI:        https://products.devcabin.tech
 * License:           GPL v2 or later
 * Text Domain:       dc-plugin-recommender
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DC_PLUGREC_VERSION', '1.0.0' );
define( 'DC_PLUGREC_DIR', plugin_dir_path( __FILE__ ) );
define( 'DC_PLUGREC_URL', plugin_dir_url( __FILE__ ) );

add_action( 'admin_menu', function () {
    add_menu_page(
        'Plugin Recommender', 'Plugin Recommender', 'manage_options',
        'dc-plugin-recommender', 'dc_plugrec_render_page',
        'dashicons-admin-plugins', 31
    );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_dc-plugin-recommender' ) return;
    wp_enqueue_style( 'dc-plugrec-style', DC_PLUGREC_URL . 'assets/admin.css', [], DC_PLUGREC_VERSION );
    wp_enqueue_script( 'dc-plugrec-script', DC_PLUGREC_URL . 'assets/admin.js', [], DC_PLUGREC_VERSION, true );
    wp_localize_script( 'dc-plugrec-script', 'dcPlugRec', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'dc_plugrec_nonce' ),
    ] );
} );

add_action( 'admin_init', function () {
    register_setting( 'dc_plugrec_settings', 'dc_plugrec_openai_key', [ 'sanitize_callback' => 'sanitize_text_field' ] );
} );

add_action( 'wp_ajax_dc_plugrec_generate', function () {
    check_ajax_referer( 'dc_plugrec_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $business_type = sanitize_text_field( $_POST['business_type'] ?? '' );
    $goals         = sanitize_textarea_field( $_POST['goals'] ?? '' );
    $budget        = sanitize_text_field( $_POST['budget'] ?? '' );
    $tech_level    = sanitize_text_field( $_POST['tech_level'] ?? 'Beginner' );
    $api_key       = get_option( 'dc_plugrec_openai_key', '' );

    if ( empty( $business_type ) ) {
        wp_send_json_error( [ 'message' => 'Business type is required.' ] );
    }
    if ( empty( $api_key ) ) {
        wp_send_json_error( [ 'message' => 'OpenAI API key not configured. Go to Settings tab.' ] );
    }

    $prompt = "You are a senior WordPress consultant. A client has described their business:\n\n" .
        "- Business Type: {$business_type}\n" .
        "- Goals: " . ( $goals ?: 'Not specified' ) . "\n" .
        "- Budget: " . ( $budget ?: 'Not specified' ) . "\n" .
        "- Technical Level: {$tech_level}\n\n" .
        "Build a complete, curated WordPress plugin stack recommendation report including:\n" .
        "1. **Recommended Plugin Stack** — Table: Plugin Name | Category | Free/Paid | Cost | Why Recommended\n" .
        "2. **Compatibility Notes** — Flag known conflicts.\n" .
        "3. **Setup Priority Order** — Numbered installation order.\n" .
        "4. **Estimated Total Cost** — Monthly and annual breakdown.\n" .
        "5. **Implementation Quote** — \$297–\$997 range with value justification.\n" .
        "6. **Red Flags to Avoid** — 3–5 problematic plugins and why.\n\n" .
        "Format in clean Markdown with tables and ✅ / ⚠️ / ❌ icons.";

    $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
        'timeout' => 60,
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => wp_json_encode( [
            'model'    => 'gpt-4o',
            'messages' => [ [ 'role' => 'user', 'content' => $prompt ] ],
        ] ),
    ] );

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( [ 'message' => $response->get_error_message() ] );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    $text = $body['choices'][0]['message']['content'] ?? '';

    if ( empty( $text ) ) {
        wp_send_json_error( [ 'message' => 'No response from OpenAI. Check your API key.' ] );
    }

    wp_send_json_success( [ 'result' => $text ] );
} );

function dc_plugrec_render_page() {
    $api_key = get_option( 'dc_plugrec_openai_key', '' );
    $tab     = $_GET['tab'] ?? 'recommender';
    ?>
    <div class="dc-wrap">
      <div class="dc-header">
        <span class="dc-header-icon">🔌</span>
        <div>
          <h1>WordPress Plugin Recommender</h1>
          <p>AI-curated plugin stacks for any business type</p>
        </div>
        <span class="dc-badge dc-badge-blue">Consulting</span>
      </div>

      <nav class="dc-tabs">
        <a href="?page=dc-plugin-recommender&tab=recommender" class="dc-tab <?php echo $tab === 'recommender' ? 'active' : ''; ?>">🔌 Recommender</a>
        <a href="?page=dc-plugin-recommender&tab=settings"    class="dc-tab <?php echo $tab === 'settings'    ? 'active' : ''; ?>">⚙️ Settings</a>
      </nav>

      <?php if ( $tab === 'settings' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">API Configuration</h2>
          <form method="post" action="options.php">
            <?php settings_fields( 'dc_plugrec_settings' ); ?>
            <div class="dc-field">
              <label>OpenAI API Key</label>
              <input type="password" name="dc_plugrec_openai_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk-..." class="dc-input" />
              <p class="dc-hint">Get your key at <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></p>
            </div>
            <?php submit_button( 'Save API Key', 'dc-btn-primary', 'submit', false ); ?>
          </form>
        </div>

      <?php else : ?>
        <?php if ( empty( $api_key ) ) : ?>
          <div class="dc-notice dc-notice-warn">⚠️ No OpenAI API key set. <a href="?page=dc-plugin-recommender&tab=settings">Go to Settings →</a></div>
        <?php endif; ?>

        <div class="dc-card">
          <h2 class="dc-section-title">Generate Plugin Stack</h2>
          <div class="dc-grid-2">
            <div class="dc-field">
              <label>Business Type <span style="color:#e53e3e">*</span></label>
              <input type="text" id="dc-business-type" placeholder="e.g. Local restaurant, SaaS startup, Law firm…" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Monthly Plugin Budget</label>
              <input type="text" id="dc-budget" placeholder="e.g. Under $50/mo, $100–$200/mo…" class="dc-input" />
            </div>
          </div>
          <div class="dc-field">
            <label>Business Goals / Needs</label>
            <textarea id="dc-goals" placeholder="e.g. Accept online orders, capture leads, run a membership site…" class="dc-input" rows="3"></textarea>
          </div>
          <div class="dc-field">
            <label>Client Technical Level</label>
            <select id="dc-tech-level" class="dc-input" style="max-width:200px">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button id="dc-generate-btn" class="dc-btn dc-btn-blue dc-btn-full" <?php echo empty( $api_key ) ? 'disabled' : ''; ?>>🔌 Generate Plugin Stack</button>
        </div>

        <div id="dc-result-wrap" class="dc-card dc-hidden">
          <div class="dc-result-header">
            <span id="dc-result-status">⏳ Building your plugin stack…</span>
            <button id="dc-copy-btn" class="dc-btn-ghost">Copy Report</button>
          </div>
          <div id="dc-result" class="dc-result"></div>
        </div>

        <div class="dc-card dc-monetize">
          <p class="dc-monetize-title">💡 How to Monetize This Agent</p>
          <ul>
            <li>Send as a <strong>free pre-sales deliverable</strong> to close new clients</li>
            <li>Charge <strong>$297–$997</strong> to implement the recommended stack</li>
            <li>Use affiliate links for premium plugins to earn <strong>passive commissions</strong></li>
            <li>Offer as a standalone <strong>$97 consulting report</strong> for DIY clients</li>
          </ul>
        </div>
      <?php endif; ?>
    </div>
    <?php
}
