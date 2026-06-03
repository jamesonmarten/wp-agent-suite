<?php
/**
 * Plugin Name:       DC Link Checker & Redirect Mapper
 * Plugin URI:        https://wp.devcabin.tech
 * Description:       Scan every link across all WordPress posts and pages, identify broken URLs and redirects, then export the results as CSV — including a one-click import file for the WordPress Redirection plugin.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Dev Cabin Technologies
 * Author URI:        https://products.devcabin.tech
 * License:           GPL v2 or later
 * Text Domain:       dc-link-checker
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'DC_LINK_VERSION', '1.0.0' );
define( 'DC_LINK_DIR', plugin_dir_path( __FILE__ ) );
define( 'DC_LINK_URL', plugin_dir_url( __FILE__ ) );

// --- Admin menu ---
add_action( 'admin_menu', function () {
    add_menu_page(
        'Link Checker',
        'Link Checker',
        'manage_options',
        'dc-link-checker',
        'dc_link_render_page',
        'dashicons-admin-links',
        30
    );
} );

// --- Enqueue assets ---
add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_dc-link-checker' ) return;
    wp_enqueue_style( 'dc-link-style', DC_LINK_URL . 'assets/admin.css', [], DC_LINK_VERSION );
    wp_enqueue_script( 'dc-link-script', DC_LINK_URL . 'assets/admin.js', [], DC_LINK_VERSION, true );
    wp_localize_script( 'dc-link-script', 'dcLink', [
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'dc_link_nonce' ),
        'siteUrl' => home_url( '/' ),
    ] );
} );

// --- Settings ---
add_action( 'admin_init', function () {
    register_setting( 'dc_link_settings', 'dc_link_post_types', [
        'sanitize_callback' => function ( $val ) {
            if ( ! is_array( $val ) ) return [ 'post', 'page' ];
            return array_map( 'sanitize_key', $val );
        },
        'default' => [ 'post', 'page' ],
    ] );
    register_setting( 'dc_link_settings', 'dc_link_timeout', [
        'sanitize_callback' => 'absint',
        'default'           => 8,
    ] );
} );

// --- Helper: collect URLs to scan ---
function dc_link_collect_urls(): array {
    $post_types = get_option( 'dc_link_post_types', [ 'post', 'page' ] );
    if ( empty( $post_types ) ) $post_types = [ 'post', 'page' ];

    $posts = get_posts( [
        'post_type'      => $post_types,
        'post_status'    => 'publish',
        'numberposts'    => -1,
        'fields'         => 'ids',
    ] );

    $urls = [];
    foreach ( $posts as $pid ) {
        $content = get_post_field( 'post_content', $pid );
        if ( empty( $content ) ) continue;
        $source  = get_permalink( $pid );

        // Match href="..." links
        if ( preg_match_all( '/href=["\']([^"\']+)["\']/i', $content, $matches ) ) {
            foreach ( $matches[1] as $href ) {
                $href = trim( $href );
                if ( $href === '' ) continue;
                if ( str_starts_with( $href, '#' ) || str_starts_with( $href, 'mailto:' ) ||
                     str_starts_with( $href, 'tel:' )  || str_starts_with( $href, 'javascript:' ) ) continue;

                // Convert relative URLs to absolute
                if ( ! preg_match( '#^https?://#i', $href ) ) {
                    $href = esc_url_raw( home_url( $href ) );
                }
                $urls[] = [
                    'source'  => $source,
                    'post_id' => $pid,
                    'url'     => $href,
                ];
            }
        }
    }
    return $urls;
}

// --- AJAX: get scan plan (returns total link count, no checks yet) ---
add_action( 'wp_ajax_dc_link_plan', function () {
    check_ajax_referer( 'dc_link_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $urls = dc_link_collect_urls();
    // Deduplicate by URL (keep first source)
    $seen = [];
    $unique = [];
    foreach ( $urls as $u ) {
        if ( isset( $seen[ $u['url'] ] ) ) continue;
        $seen[ $u['url'] ] = true;
        $unique[] = $u;
    }
    // Store in a transient so the batch handler can pick them up
    set_transient( 'dc_link_queue_' . get_current_user_id(), $unique, HOUR_IN_SECONDS );

    wp_send_json_success( [
        'total'   => count( $unique ),
        'sample'  => array_slice( $unique, 0, 5 ),
        'sources' => count( array_unique( wp_list_pluck( $urls, 'source' ) ) ),
    ] );
} );

// --- AJAX: check a batch of links ---
add_action( 'wp_ajax_dc_link_batch', function () {
    check_ajax_referer( 'dc_link_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $offset = absint( $_POST['offset'] ?? 0 );
    $size   = min( 10, absint( $_POST['size'] ?? 10 ) );
    $queue  = get_transient( 'dc_link_queue_' . get_current_user_id() );
    if ( ! is_array( $queue ) || empty( $queue ) ) {
        wp_send_json_error( [ 'message' => 'No scan queued. Click "Plan Scan" first.' ] );
    }

    $batch   = array_slice( $queue, $offset, $size );
    $timeout = absint( get_option( 'dc_link_timeout', 8 ) );
    $home    = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
    $results = [];

    foreach ( $batch as $item ) {
        $url = $item['url'];
        $host = wp_parse_url( $url, PHP_URL_HOST );
        $type = ( $host === $home ) ? 'internal' : 'external';

        $resp = wp_remote_head( $url, [
            'timeout'     => $timeout,
            'redirection' => 0,
            'sslverify'   => false,
            'user-agent'  => 'DC-LinkChecker/1.0 (+' . home_url() . ')',
        ] );

        if ( is_wp_error( $resp ) ) {
            // Retry with GET (some servers reject HEAD)
            $resp = wp_remote_get( $url, [
                'timeout'     => $timeout,
                'redirection' => 0,
                'sslverify'   => false,
                'user-agent'  => 'DC-LinkChecker/1.0',
                'headers'     => [ 'Range' => 'bytes=0-0' ],
            ] );
        }

        if ( is_wp_error( $resp ) ) {
            $results[] = [
                'source'  => $item['source'],
                'post_id' => $item['post_id'],
                'url'     => $url,
                'status'  => 0,
                'ok'      => false,
                'redirect'=> '',
                'error'   => $resp->get_error_message(),
                'type'    => $type,
            ];
            continue;
        }

        $code     = (int) wp_remote_retrieve_response_code( $resp );
        $location = wp_remote_retrieve_header( $resp, 'location' );

        // If HEAD returned an error code, try GET
        if ( in_array( $code, [ 400, 403, 405, 501 ], true ) ) {
            $resp2 = wp_remote_get( $url, [
                'timeout'     => $timeout,
                'redirection' => 0,
                'sslverify'   => false,
                'user-agent'  => 'DC-LinkChecker/1.0',
            ] );
            if ( ! is_wp_error( $resp2 ) ) {
                $code     = (int) wp_remote_retrieve_response_code( $resp2 );
                $location = wp_remote_retrieve_header( $resp2, 'location' );
            }
        }

        $results[] = [
            'source'   => $item['source'],
            'post_id'  => $item['post_id'],
            'url'      => $url,
            'status'   => $code,
            'ok'       => ( $code >= 200 && $code < 400 ),
            'redirect' => ( $code >= 300 && $code < 400 ) ? (string) $location : '',
            'error'    => '',
            'type'     => $type,
        ];
    }

    // Save running results into option for later export
    $prior = get_option( 'dc_link_last_results', [] );
    if ( $offset === 0 ) $prior = [];
    $prior = array_merge( $prior, $results );
    update_option( 'dc_link_last_results', $prior, false );

    wp_send_json_success( [
        'results'    => $results,
        'nextOffset' => $offset + count( $batch ),
        'total'      => count( $queue ),
        'done'       => ( $offset + count( $batch ) ) >= count( $queue ),
    ] );
} );

// --- AJAX: export CSV (full or redirection format) ---
add_action( 'wp_ajax_dc_link_export', function () {
    check_ajax_referer( 'dc_link_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $format  = sanitize_key( $_POST['format'] ?? 'full' );
    $results = get_option( 'dc_link_last_results', [] );
    if ( empty( $results ) ) {
        wp_send_json_error( [ 'message' => 'No results to export. Run a scan first.' ] );
    }

    if ( $format === 'redirection' ) {
        // Format compatible with the Redirection plugin CSV import
        $rows = [ [ 'source', 'target', 'regex', 'code' ] ];
        foreach ( $results as $r ) {
            if ( empty( $r['redirect'] ) ) continue;
            $src_path = wp_parse_url( $r['url'], PHP_URL_PATH ) ?: $r['url'];
            $rows[] = [ $src_path, $r['redirect'], '0', '301' ];
        }
        $filename = 'dc-redirection-import-' . gmdate( 'Y-m-d' ) . '.csv';
    } else {
        $rows = [ [ 'source', 'url', 'status', 'ok', 'redirect', 'error', 'type' ] ];
        foreach ( $results as $r ) {
            $rows[] = [
                $r['source'],
                $r['url'],
                $r['status'],
                $r['ok'] ? 'true' : 'false',
                $r['redirect'],
                $r['error'],
                $r['type'],
            ];
        }
        $filename = 'dc-link-check-' . gmdate( 'Y-m-d' ) . '.csv';
    }

    $csv = '';
    foreach ( $rows as $row ) {
        $csv .= implode( ',', array_map( function ( $c ) {
            $c = (string) $c;
            return '"' . str_replace( '"', '""', $c ) . '"';
        }, $row ) ) . "\n";
    }

    wp_send_json_success( [
        'filename' => $filename,
        'csv'      => $csv,
        'rows'     => count( $rows ) - 1,
    ] );
} );

// --- AJAX: import a redirection CSV (writes to the Redirection plugin if active, otherwise stores them) ---
add_action( 'wp_ajax_dc_link_import', function () {
    check_ajax_referer( 'dc_link_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized', 403 );

    $csv = wp_unslash( $_POST['csv'] ?? '' );
    if ( empty( $csv ) ) wp_send_json_error( [ 'message' => 'No CSV data provided.' ] );

    $lines = preg_split( '/\r?\n/', trim( $csv ) );
    if ( count( $lines ) < 2 ) wp_send_json_error( [ 'message' => 'CSV has no data rows.' ] );

    $header  = str_getcsv( array_shift( $lines ) );
    $idxSrc  = array_search( 'source', $header, true );
    $idxTgt  = array_search( 'target', $header, true );
    if ( $idxSrc === false || $idxTgt === false ) {
        wp_send_json_error( [ 'message' => 'CSV must include "source" and "target" columns.' ] );
    }

    $imported = [];
    foreach ( $lines as $line ) {
        if ( trim( $line ) === '' ) continue;
        $row = str_getcsv( $line );
        $src = trim( $row[ $idxSrc ] ?? '' );
        $tgt = trim( $row[ $idxTgt ] ?? '' );
        if ( $src === '' || $tgt === '' ) continue;
        $imported[] = [ 'source' => $src, 'target' => $tgt, 'code' => 301 ];
    }

    // If the Redirection plugin is active, write into its table
    global $wpdb;
    $redirection_table = $wpdb->prefix . 'redirection_items';
    $has_redirection   = ! empty( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $redirection_table ) ) );

    if ( $has_redirection ) {
        $group_id = 1; // default group
        foreach ( $imported as $r ) {
            $wpdb->insert( $redirection_table, [
                'url'         => $r['source'],
                'action_data' => $r['target'],
                'action_code' => $r['code'],
                'action_type' => 'url',
                'match_type'  => 'url',
                'group_id'    => $group_id,
                'status'      => 'enabled',
                'position'    => 0,
                'last_count'  => 0,
            ] );
        }
        wp_send_json_success( [
            'imported' => count( $imported ),
            'target'   => 'Redirection plugin (wp_redirection_items)',
        ] );
    } else {
        // Fallback: store as plugin option so user can use them later
        update_option( 'dc_link_pending_redirects', $imported, false );
        wp_send_json_success( [
            'imported' => count( $imported ),
            'target'   => 'Stored locally (Redirection plugin not detected)',
        ] );
    }
} );

// --- Render page ---
function dc_link_render_page() {
    $tab        = $_GET['tab'] ?? 'scanner';
    $post_types = get_option( 'dc_link_post_types', [ 'post', 'page' ] );
    $timeout    = (int) get_option( 'dc_link_timeout', 8 );
    $available  = get_post_types( [ 'public' => true ], 'objects' );
    ?>
    <div class="dc-wrap">
      <div class="dc-header">
        <span class="dc-header-icon">🔗</span>
        <div>
          <h1>Link Checker & Redirect Mapper</h1>
          <p>Scan every link on your site · Export to WP Redirection plugin</p>
        </div>
        <span class="dc-badge dc-badge-blue">SEO Ops</span>
      </div>

      <nav class="dc-tabs">
        <a href="?page=dc-link-checker&tab=scanner"  class="dc-tab <?php echo $tab === 'scanner'  ? 'active' : ''; ?>">🔍 Scanner</a>
        <a href="?page=dc-link-checker&tab=import"   class="dc-tab <?php echo $tab === 'import'   ? 'active' : ''; ?>">⬆ Import</a>
        <a href="?page=dc-link-checker&tab=settings" class="dc-tab <?php echo $tab === 'settings' ? 'active' : ''; ?>">⚙️ Settings</a>
      </nav>

      <?php if ( $tab === 'settings' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">Scan Configuration</h2>
          <form method="post" action="options.php">
            <?php settings_fields( 'dc_link_settings' ); ?>

            <div class="dc-field">
              <label>Post types to scan</label>
              <?php foreach ( $available as $pt ) : ?>
                <label style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;font-weight:500;color:#444">
                  <input type="checkbox" name="dc_link_post_types[]" value="<?php echo esc_attr( $pt->name ); ?>"
                         <?php checked( in_array( $pt->name, $post_types, true ) ); ?> />
                  <?php echo esc_html( $pt->labels->name ); ?> (<?php echo esc_html( $pt->name ); ?>)
                </label>
              <?php endforeach; ?>
              <p class="dc-hint">Only published content is scanned.</p>
            </div>

            <div class="dc-field">
              <label>Request timeout (seconds)</label>
              <input type="number" name="dc_link_timeout" min="3" max="30" value="<?php echo esc_attr( $timeout ); ?>" class="dc-input" style="max-width:120px" />
              <p class="dc-hint">How long to wait for each link before marking it as failed.</p>
            </div>
            <?php submit_button( 'Save Settings', 'dc-btn-primary', 'submit', false ); ?>
          </form>
        </div>

      <?php elseif ( $tab === 'import' ) : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">Import Redirects (CSV)</h2>
          <p class="dc-hint" style="margin-bottom:14px">
            Paste a CSV with <code>source,target</code> columns (the same format exported by the Scanner tab).
            If the <strong>Redirection plugin</strong> is installed, these will be inserted as 301 redirects automatically.
            Otherwise they'll be stored on this plugin's options for later use.
          </p>
          <div class="dc-field">
            <label>CSV content</label>
            <textarea id="dc-import-csv" class="dc-input" rows="10" placeholder="source,target,regex,code&#10;/old-page,/new-page,0,301"></textarea>
          </div>
          <button id="dc-import-btn" class="dc-btn dc-btn-blue">⬆ Import Redirects</button>
          <div id="dc-import-result" style="margin-top:14px"></div>
        </div>

      <?php else : ?>
        <div class="dc-card">
          <h2 class="dc-section-title">Step 1 · Plan the scan</h2>
          <p class="dc-hint" style="margin-bottom:14px">
            Scans <strong><?php echo esc_html( implode( ', ', $post_types ) ); ?></strong>.
            Change post types in the <a href="?page=dc-link-checker&tab=settings">Settings</a> tab.
          </p>
          <button id="dc-plan-btn" class="dc-btn dc-btn-blue">🔎 Plan Scan</button>
          <div id="dc-plan-result" style="margin-top:14px"></div>
        </div>

        <div class="dc-card dc-hidden" id="dc-scan-card">
          <h2 class="dc-section-title">Step 2 · Run the link check</h2>
          <button id="dc-run-btn" class="dc-btn dc-btn-blue dc-btn-full">▶ Start Scan</button>
          <div id="dc-progress-wrap" style="margin-top:14px"></div>
        </div>

        <div class="dc-card dc-hidden" id="dc-results-card">
          <h2 class="dc-section-title">Results</h2>
          <div id="dc-summary" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px"></div>
          <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="dc-btn-ghost" id="dc-export-full">⬇ Full CSV</button>
            <button class="dc-btn-ghost" id="dc-export-redirection">⬇ WP Redirection CSV</button>
          </div>
          <div style="max-height:480px;overflow:auto;border:1px solid #eee;border-radius:10px">
            <table id="dc-results-table" style="width:100%;border-collapse:collapse;font-size:12px">
              <thead style="position:sticky;top:0;background:#f5f5f7">
                <tr>
                  <th style="text-align:left;padding:6px 10px">Status</th>
                  <th style="text-align:left;padding:6px 10px">URL</th>
                  <th style="text-align:left;padding:6px 10px">Found on</th>
                  <th style="text-align:left;padding:6px 10px">Type</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div class="dc-card dc-monetize">
          <p class="dc-monetize-title">💡 How to Monetize This Agent</p>
          <ul>
            <li>Sell <strong>$149–$497 SEO audits</strong> — broken links destroy rankings</li>
            <li>Offer <strong>$49/mo recurring scans</strong> as a care-plan add-on</li>
            <li>Deliver the <strong>WP Redirection CSV</strong> as a $99 implementation upsell</li>
            <li>Pair with <strong>site migrations</strong> — automate 301 mapping</li>
          </ul>
        </div>
      <?php endif; ?>
    </div>
    <?php
}
