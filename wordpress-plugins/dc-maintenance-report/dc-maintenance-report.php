<?php
/**
 * Plugin Name:       DC Maintenance Report
 * Plugin URI:        https://products.devcabin.tech
 * Description:       Auto-generate polished, white-label monthly maintenance reports for your WordPress clients. Bundle into $99–$299/mo care plans.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Dev Cabin Technologies
 * Author URI:        https://products.devcabin.tech
 * License:           GPL v2 or later
 * Text Domain:       dc-maintenance-report
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DC_MAINT_VERSION', '1.0.0' );
define( 'DC_MAINT_URL', plugin_dir_url( __FILE__ ) );

add_action( 'admin_menu', function () {
    add_menu_page(
        'Maintenance Report', 'Maint. Report', 'manage_options',
        'dc-maintenance-report', 'dc_maint_render_page',
        'dashicons-chart-bar', 33
    );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_dc-maintenance-report' ) return;
    wp_enqueue_style(  'dc-maint-style',  DC_MAINT_URL . 'assets/admin.css', [], DC_MAINT_VERSION );
    wp_enqueue_script( 'dc-maint-script', DC_MAINT_URL . 'assets/admin.js',  [], DC_MAINT_VERSION, true );
    wp_localize_script( 'dc-maint-script', 'dcMaint', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'dc_maint_nonce' ),
    ] );
} );

add_action( 'admin_init', function () {
    register_setting( 'dc_maint_settings', 'dc_maint_openai_key',   [ 'sanitize_callback' => 'sanitize_text_field' ] );
    register_setting( 'dc_maint_settings', 'dc_maint_agency_name',  [ 'sanitize_callback' => 'sanitize_text_field' ] );
} );

add_action( 'wp_ajax_dc_maint_generate', function () {
    check_ajax_referer( 'dc_maint_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $fields  = [ 'client_name', 'site_name', 'month', 'year', 'plugins_updated', 'themes_updated',
                 'backups_completed', 'uptime_percent', 'security_scans', 'issues_resolved' ];
    $data    = [];
    foreach ( $fields as $f ) {
        $data[ $f ] = sanitize_text_field( $_POST[ $f ] ?? '' );
    }
    $api_key     = get_option( 'dc_maint_openai_key', '' );
    $agency_name = get_option( 'dc_maint_agency_name', 'Dev Cabin Technologies' );

    if ( empty( $data['client_name'] ) || empty( $data['site_name'] ) ) {
        wp_send_json_error( [ 'message' => 'Client name and site name are required.' ] );
    }
    if ( empty( $api_key ) ) {
        wp_send_json_error( [ 'message' => 'OpenAI API key not configured. Go to Settings tab.' ] );
    }

    $prompt = "You are a professional WordPress agency writing a monthly maintenance report for a client.\n\n" .
        "- Client Name: {$data['client_name']}\n" .
        "- Website: {$data['site_name']}\n" .
        "- Report Period: {$data['month']} {$data['year']}\n" .
        "- Plugins Updated: {$data['plugins_updated']}\n" .
        "- Themes Updated: {$data['themes_updated']}\n" .
        "- Backups Completed: {$data['backups_completed']}\n" .
        "- Uptime: {$data['uptime_percent']}%\n" .
        "- Security Scans Run: {$data['security_scans']}\n" .
        "- Issues Resolved: " . ( $data['issues_resolved'] ?: 'None' ) . "\n" .
        "- Agency Name: {$agency_name}\n\n" .
        "Generate a full monthly maintenance report with: Header, Executive Summary, Work Completed table (✅), " .
        "Site Health Score, Uptime Report, Security Report, Backup Report, Performance Summary, " .
        "Issues & Resolutions, Next Month's Plan, Value Summary, Contact & Support.\n\n" .
        "Format as a premium Markdown document with tables and ✅ icons throughout.";

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

function dc_maint_render_page() {
    $api_key     = get_option( 'dc_maint_openai_key', '' );
    $agency_name = get_option( 'dc_maint_agency_name', 'Dev Cabin Technologies' );
    $tab         = $_GET['tab'] ?? 'report';
    $months      = [ 'January','February','March','April','May','June','July','August','September','October','November','December' ];
    $cur_month   = date('F');
    $cur_year    = date('Y');
    ?>
    <div class="dc-wrap">
      <div class="dc-header">
        <span class="dc-header-icon">📊</span>
        <div>
          <h1>Monthly Maintenance Report Agent</h1>
          <p>Auto-generate branded client reports in seconds</p>
        </div>
        <span class="dc-badge dc-badge-green">Retention</span>
      </div>

      <nav class="dc-tabs">
        <a href="?page=dc-maintenance-report&tab=report"   class="dc-tab <?php echo $tab === 'report'   ? 'active' : ''; ?>">📊 Generate Report</a>
        <a href="?page=dc-maintenance-report&tab=settings" class="dc-tab <?php echo $tab === 'settings' ? 'active' : ''; ?>">⚙️ Settings</a>
      </nav>

      <?php if ( $tab === 'settings' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">API & Agency Configuration</h2>
          <form method="post" action="options.php">
            <?php settings_fields( 'dc_maint_settings' ); ?>
            <div class="dc-field">
              <label>OpenAI API Key</label>
              <input type="password" name="dc_maint_openai_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="sk-..." class="dc-input" />
              <p class="dc-hint">Get your key at <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></p>
            </div>
            <div class="dc-field">
              <label>Your Agency Name</label>
              <input type="text" name="dc_maint_agency_name" value="<?php echo esc_attr( $agency_name ); ?>" placeholder="Dev Cabin Technologies" class="dc-input" style="max-width:360px" />
              <p class="dc-hint">Appears in all generated reports.</p>
            </div>
            <?php submit_button( 'Save Settings', 'dc-btn-primary', 'submit', false ); ?>
          </form>
        </div>

      <?php else : ?>
        <?php if ( empty( $api_key ) ) : ?>
          <div class="dc-notice dc-notice-warn">⚠️ No OpenAI API key set. <a href="?page=dc-maintenance-report&tab=settings">Go to Settings →</a></div>
        <?php endif; ?>

        <div class="dc-card">
          <h2 class="dc-section-title">Generate Client Report</h2>
          <div class="dc-grid-2">
            <div class="dc-field">
              <label>Client Name <span style="color:#e53e3e">*</span></label>
              <input type="text" id="dc-client-name" placeholder="e.g. Acme Corp" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Website / Site Name <span style="color:#e53e3e">*</span></label>
              <input type="text" id="dc-site-name" placeholder="e.g. acmecorp.com" class="dc-input" />
            </div>
          </div>
          <div class="dc-grid-3">
            <div class="dc-field">
              <label>Report Month</label>
              <select id="dc-month" class="dc-input">
                <?php foreach ( $months as $m ) : ?>
                  <option <?php selected( $m, $cur_month ); ?>><?php echo $m; ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="dc-field">
              <label>Year</label>
              <input type="number" id="dc-year" value="<?php echo esc_attr( $cur_year ); ?>" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Uptime %</label>
              <input type="text" id="dc-uptime" value="99.9" class="dc-input" />
            </div>
          </div>
          <div class="dc-grid-4">
            <div class="dc-field">
              <label>Plugins Updated</label>
              <input type="number" id="dc-plugins-updated" placeholder="12" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Themes Updated</label>
              <input type="number" id="dc-themes-updated" placeholder="1" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Backups Completed</label>
              <input type="number" id="dc-backups" placeholder="30" class="dc-input" />
            </div>
            <div class="dc-field">
              <label>Security Scans</label>
              <input type="number" id="dc-security-scans" placeholder="4" class="dc-input" />
            </div>
          </div>
          <div class="dc-field">
            <label>Issues Resolved (optional)</label>
            <input type="text" id="dc-issues" placeholder="e.g. Fixed broken contact form, resolved SSL warning…" class="dc-input" />
          </div>
          <button id="dc-generate-btn" class="dc-btn dc-btn-green dc-btn-full" <?php echo empty( $api_key ) ? 'disabled' : ''; ?>>📊 Generate Client Report</button>
        </div>

        <div id="dc-result-wrap" class="dc-card dc-hidden">
          <div class="dc-result-header">
            <span id="dc-result-status">⏳ Writing your client report…</span>
            <button id="dc-copy-btn" class="dc-btn-ghost">Copy Report</button>
          </div>
          <div id="dc-result" class="dc-result"></div>
        </div>

        <div class="dc-card dc-monetize">
          <p class="dc-monetize-title">💡 How to Monetize This Agent</p>
          <ul>
            <li>Justifies your <strong>$99–$299/mo care plan</strong> with a tangible deliverable</li>
            <li>Takes 60 seconds — <strong>replaces 2 hours of manual work</strong></li>
            <li>Clients who receive reports <strong>churn 40% less</strong></li>
            <li>Use as a <strong>free sample</strong> to convert one-off clients to retainer</li>
          </ul>
        </div>
      <?php endif; ?>
    </div>
    <?php
}
