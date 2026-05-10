<?php
/**
 * Plugin Name:       DC Child Theme Builder
 * Plugin URI:        https://products.devcabin.tech
 * Description:       AI-powered child theme and CSS snippet generator. Describe any design change — get production-ready CSS, PHP code, and conflict warnings for all major themes.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Dev Cabin Technologies
 * Author URI:        https://products.devcabin.tech
 * License:           GPL v2 or later
 * Text Domain:       dc-child-theme-builder
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DC_CTB_VERSION', '1.0.0' );
define( 'DC_CTB_URL', plugin_dir_url( __FILE__ ) );

add_action( 'admin_menu', function () {
    add_menu_page(
        'Child Theme Builder', 'Child Theme Builder', 'manage_options',
        'dc-child-theme-builder', 'dc_ctb_render_page',
        'dashicons-art', 34
    );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_dc-child-theme-builder' ) return;
    wp_enqueue_style(  'dc-ctb-style',  DC_CTB_URL . 'assets/admin.css', [], DC_CTB_VERSION );
    wp_enqueue_script( 'dc-ctb-script', DC_CTB_URL . 'assets/admin.js',  [], DC_CTB_VERSION, true );
    wp_localize_script( 'dc-ctb-script', 'dcCtb', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'dc_ctb_nonce' ),
    ] );
} );

add_action( 'admin_init', function () {
    register_setting( 'dc_ctb_settings', 'dc_ctb_openai_key', [ 'sanitize_callback' => 'sanitize_text_field' ] );
} );

add_action( 'wp_ajax_dc_ctb_generate', function () {
    check_ajax_referer( 'dc_ctb_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $request      = sanitize_textarea_field( $_POST['request']       ?? '' );
    $theme        = sanitize_text_field(     $_POST['theme']         ?? '' );
    $theme_ver    = sanitize_text_field(     $_POST['theme_version'] ?? '' );
    $context      = sanitize_textarea_field( $_POST['context']       ?? '' );
    $api_key      = get_option( 'dc_ctb_openai_key', '' );

    if ( empty( $request ) )  { wp_send_json_error( [ 'message' => 'Request description is required.' ] ); }
    if ( empty( $api_key ) )  { wp_send_json_error( [ 'message' => 'OpenAI API key not configured. Go to Settings tab.' ] ); }

    $prompt = "You are an expert WordPress developer specializing in child themes and CSS customization.\n\n" .
        "- Requested Change: {$request}\n" .
        "- Parent Theme: " . ( $theme ?: 'Unknown (provide generic + theme-specific versions)' ) . "\n" .
        "- Theme Version: " . ( $theme_ver ?: 'Latest' ) . "\n" .
        "- Additional Context: " . ( $context ?: 'None' ) . "\n\n" .
        "Generate a complete development package:\n" .
        "1. **Solution Overview** — Plain-English explanation.\n" .
        "2. **Child Theme Setup** — style.css header, functions.php boilerplate, directory structure.\n" .
        "3. **CSS Snippet** — Complete, commented CSS with desktop and mobile breakpoints.\n" .
        "4. **PHP Snippet** — Any functions.php code required, with comments.\n" .
        "5. **Theme-Specific Notes** — Divi, Elementor, Astra, GeneratePress, Kadence, OceanWP, Avada instructions if relevant.\n" .
        "6. **Conflict Warnings** — Known plugin conflicts and cache purge requirements.\n" .
        "7. **How to Implement** — Step-by-step numbered instructions.\n" .
        "8. **Testing Checklist** — 5–8 verification items.\n\n" .
        "Format in clean Markdown. Wrap all code in fenced blocks (\`\`\`css, \`\`\`php). Production-ready and well-commented.";

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

function dc_ctb_render_page() {
    $api_key = get_option( 'dc_ctb_openai_key', '' );
    $tab     = $_GET['tab'] ?? 'builder';
    $themes  = [ '', 'Divi', 'Elementor (Hello)', 'Astra', 'GeneratePress', 'Kadence', 'OceanWP', 'Avada', 'Flatsome', 'Neve', 'Other' ];
    ?>
    <div class="dc-wrap">
      <div class="dc-header">
        <span class="dc-header-icon">🎨</span>
        <div>
          <h1>Child Theme & CSS Snippet Agent</h1>
          <p>Production-ready CSS, PHP & child theme scaffolds on demand</p>
        </div>
        <span class="dc-badge dc-badge-purple">Dev Tools</span>
      </div>

      <nav class="dc-tabs">
        <a href="?page=dc-child-theme-builder&tab=builder"  class="dc-tab <?php echo $tab === 'builder'  ? 'active' : ''; ?>">🎨 Builder</a>
        <a href="?page=dc-child-theme-builder&tab=settings" class="dc-tab <?php echo $tab === 'settings' ? 'active' : ''; ?>">⚙️ Settings</a>
      </nav>

      <?php if ( $tab === 'settings' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">API Configuration</h2>
          <form method="post" action="options.php">
            <?php settings_fields( 'dc_ctb_settings' ); ?>
            <div class="dc-field">
              <label>OpenAI API Key</label>
              <input type="password" name="dc_ctb_openai_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk-..." class="dc-input" />
              <p class="dc-hint">Get your key at <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></p>
            </div>
            <?php submit_button( 'Save API Key', 'dc-btn-primary', 'submit', false ); ?>
          </form>
        </div>

      <?php else : ?>
        <?php if ( empty( $api_key ) ) : ?>
          <div class="dc-notice dc-notice-warn">⚠️ No OpenAI API key set. <a href="?page=dc-child-theme-builder&tab=settings">Go to Settings →</a></div>
        <?php endif; ?>

        <div class="dc-card">
          <h2 class="dc-section-title">Generate CSS & Child Theme Code</h2>
          <div class="dc-field">
            <label>What do you need to change or build? <span style="color:#e53e3e">*</span></label>
            <textarea id="dc-request" placeholder="e.g. Change the header background to dark navy on scroll, make the mobile menu full-screen overlay, add a sticky CTA bar at the bottom on mobile…" class="dc-input" rows="4"></textarea>
          </div>
          <div class="dc-grid-2">
            <div class="dc-field">
              <label>Parent Theme</label>
              <select id="dc-theme" class="dc-input">
                <?php foreach ( $themes as $t ) : ?>
                  <option value="<?php echo esc_attr( $t ); ?>"><?php echo $t ?: 'Select theme…'; ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="dc-field">
              <label>Theme Version (optional)</label>
              <input type="text" id="dc-theme-version" placeholder="e.g. 5.4.2" class="dc-input" />
            </div>
          </div>
          <div class="dc-field">
            <label>Additional Context (optional)</label>
            <input type="text" id="dc-context" placeholder="e.g. Using WooCommerce, Elementor Pro, accent color #6B21A8…" class="dc-input" />
          </div>
          <button id="dc-generate-btn" class="dc-btn dc-btn-purple dc-btn-full" <?php echo empty( $api_key ) ? 'disabled' : ''; ?>>🎨 Generate CSS & Child Theme Code</button>
        </div>

        <div id="dc-result-wrap" class="dc-card dc-hidden">
          <div class="dc-result-header">
            <span id="dc-result-status">⏳ Writing your code…</span>
            <button id="dc-copy-btn" class="dc-btn-ghost">Copy Code</button>
          </div>
          <div id="dc-result" class="dc-result" style="font-family:'Fira Code','Consolas',monospace"></div>
        </div>

        <div class="dc-card dc-monetize">
          <p class="dc-monetize-title">💡 How to Monetize This Agent</p>
          <ul>
            <li>Sell <strong>individual CSS fixes at $97–$197</strong> — takes 30 seconds to generate</li>
            <li>Bundle 10 customizations into a <strong>$497/mo dev retainer</strong></li>
            <li>Offer <strong>child theme setup as an add-on</strong> to every new site build (+$297)</li>
            <li>Use for <strong>rapid client deliveries</strong> — respond to requests same-day</li>
          </ul>
        </div>
      <?php endif; ?>
    </div>
    <?php
}
