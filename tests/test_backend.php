<?php
/**
 * Local Backend Test Runner for QR Studio
 * Validates DB schema, UA parsing, REST API inputs/outputs, and redirect logic.
 */

// Define WordPress constants and mocks if running outside WordPress
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/../' );
    define( 'QR_PLUGIN_VERSION', '1.1.0' );
    define( 'QR_PLUGIN_DB_VERSION', '1.0.0' );
    define( 'QR_PLUGIN_DIR', dirname( __DIR__ ) . '/' );
    define( 'QR_PLUGIN_URL', 'http://localhost/wp-content/plugins/qr-wp-plugin/' );

    function esc_url_raw( $url ) { return filter_var( $url, FILTER_SANITIZE_URL ); }
    function sanitize_text_field( $str ) { return trim( strip_tags( (string)$str ) ); }
    function sanitize_title( $title ) {
        $title = strtolower( trim( $title ) );
        return preg_replace( '/[^a-z0-9_-]/', '', $title );
    }
    function wp_unslash( $val ) { return $val; }
    function wp_json_encode( $data ) { return json_encode( $data ); }
    function trailingslashit( $str ) { return rtrim( $str, '/\\' ) . '/'; }
    function home_url( $path = '' ) { return 'https://jadaan.dev/md' . ( $path ? '/' . ltrim( $path, '/' ) : '' ); }
    function current_time( $type ) { return date( 'Y-m-d H:i:s' ); }
    function wp_salt( $scheme = 'auth' ) { return 'mock_secret_salt_xyz'; }
    function wp_generate_password( $len = 6, $special = false ) {
        return substr( str_shuffle( 'abcdefghijklmnopqrstuvwxyz0123456789' ), 0, $len );
    }

    // Mock WP_REST_Request
    class WP_REST_Request {
        private $params = array();
        public function __construct( $params = array() ) { $this->params = $params; }
        public function get_json_params() { return $this->params; }
        public function get_param( $key ) { return $this->params[$key] ?? null; }
        public function offsetGet( $key ) { return $this->params[$key] ?? null; }
    }

    function rest_ensure_response( $data ) { return (object) array( 'data' => $data ); }
    class WP_Error {
        public $code; public $message; public $data;
        public function __construct( $c, $m, $d ) { $this->code = $c; $this->message = $m; $this->data = $d; }
    }

    // Mock $wpdb using SQLite in memory
    class MockWPDB {
        public $prefix = 'wp_';
        public $pdo;
        public $insert_id = 0;
        public $fail_next_write = false;

        public function __construct() {
            $this->pdo = new PDO( 'sqlite::memory:' );
            $this->pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
        }

        public function get_charset_collate() { return ''; }

        public function query( $sql ) {
            return $this->pdo->exec( $sql );
        }

        public function get_var( $sql ) {
            $stmt = $this->pdo->query( $sql );
            return $stmt ? $stmt->fetchColumn() : null;
        }

        public function get_row( $sql ) {
            $stmt = $this->pdo->query( $sql );
            return $stmt ? $stmt->fetchObject() : null;
        }

        public function get_results( $sql ) {
            $stmt = $this->pdo->query( $sql );
            return $stmt ? $stmt->fetchAll( PDO::FETCH_CLASS ) : array();
        }

        public function prepare( $query, ...$args ) {
            // Very simple sprintf-style formatter for testing
            foreach ( $args as $arg ) {
                $quoted = is_numeric( $arg ) ? $arg : "'" . addslashes( (string)$arg ) . "'";
                $query = preg_replace( '/%[sdf]/', $quoted, $query, 1 );
            }
            return $query;
        }

        public function insert( $table, $data, $format = null ) {
            if ( $this->fail_next_write ) { $this->fail_next_write = false; return false; }
            $cols = array_keys( $data );
            $placeholders = array_fill( 0, count( $cols ), '?' );
            $sql = "INSERT INTO {$table} (" . implode( ',', $cols ) . ") VALUES (" . implode( ',', $placeholders ) . ")";
            $stmt = $this->pdo->prepare( $sql );
            $stmt->execute( array_values( $data ) );
            $this->insert_id = (int) $this->pdo->lastInsertId();
            return 1;
        }

        public function update( $table, $data, $where, $format = null, $where_format = null ) {
            if ( $this->fail_next_write ) { $this->fail_next_write = false; return false; }
            $set = array();
            $vals = array();
            foreach ( $data as $k => $v ) {
                $set[] = "{$k} = ?";
                $vals[] = $v;
            }
            $whereClause = array();
            foreach ( $where as $k => $v ) {
                $whereClause[] = "{$k} = ?";
                $vals[] = $v;
            }
            $sql = "UPDATE {$table} SET " . implode( ',', $set ) . " WHERE " . implode( ' AND ', $whereClause );
            $stmt = $this->pdo->prepare( $sql );
            return $stmt->execute( $vals );
        }

        public function delete( $table, $where, $where_format = null ) {
            $whereClause = array();
            $vals = array();
            foreach ( $where as $k => $v ) {
                $whereClause[] = "{$k} = ?";
                $vals[] = $v;
            }
            $sql = "DELETE FROM {$table} WHERE " . implode( ' AND ', $whereClause );
            $stmt = $this->pdo->prepare( $sql );
            return $stmt->execute( $vals );
        }
    }

    global $wpdb;
    $wpdb = new MockWPDB();
}

require_once __DIR__ . '/../includes/class-qr-db.php';
require_once __DIR__ . '/../includes/class-qr-redirect.php';
require_once __DIR__ . '/../includes/class-qr-rest.php';

echo "====================================================\n";
echo "       QR STUDIO BACKEND LOCAL VERIFICATION         \n";
echo "====================================================\n\n";

$tests_passed = 0;
$total_tests = 0;

function assert_test( $name, $condition ) {
    global $tests_passed, $total_tests;
    $total_tests++;
    if ( $condition ) {
        $tests_passed++;
        echo " [PASS] $name\n";
    } else {
        echo " [FAIL] $name\n";
    }
}

// 1. Test Database Schema creation in SQLite
$wpdb->query( "CREATE TABLE IF NOT EXISTS wp_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(64) UNIQUE,
    title VARCHAR(255) DEFAULT 'Untitled QR',
    qr_type VARCHAR(50) DEFAULT 'website',
    target_url TEXT NOT NULL,
    style_config TEXT NOT NULL,
    scans_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);" );

$wpdb->query( "CREATE TABLE IF NOT EXISTS wp_qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_id INTEGER NOT NULL,
    slug VARCHAR(64) NOT NULL,
    ip_hash VARCHAR(64) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    device VARCHAR(50) DEFAULT 'Desktop',
    os VARCHAR(50) DEFAULT 'Unknown',
    browser VARCHAR(50) DEFAULT 'Unknown',
    referrer VARCHAR(255) DEFAULT '',
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);" );

assert_test( "Database tables created successfully", $wpdb->get_var( "SELECT COUNT(*) FROM wp_qr_codes" ) !== null );

// 2. Test User Agent Parser
$iphone_ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
$parsed = QR_Redirect::parse_user_agent( $iphone_ua );
assert_test( "UA Parser detects Mobile device", $parsed['device'] === 'Mobile' );
assert_test( "UA Parser detects iOS", $parsed['os'] === 'iOS' );
assert_test( "UA Parser detects Safari", $parsed['browser'] === 'Safari' );

$android_ua = 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36';
$parsed_android = QR_Redirect::parse_user_agent( $android_ua );
assert_test( "UA Parser detects Android OS", $parsed_android['os'] === 'Android' );
assert_test( "UA Parser detects Chrome Browser", $parsed_android['browser'] === 'Chrome' );

// 3. Test REST API: Save Code (Create new 4Jwdh)
$req = new WP_REST_Request( array(
    'title'        => '4Jwdh',
    'slug'         => '4jwdh',
    'target_url'   => 'https://jadaan.dev/md/summer-promo',
    'qr_type'      => 'website',
    'style_config' => array( 'pattern' => 'classy', 'patternColor' => '#522b2b' ),
    'is_active'    => 1,
) );

$resp = QR_REST::save_code( $req );
$data = $resp->data['data'] ?? null;
assert_test( "REST save_code returns success", ! empty( $resp->data['success'] ) );
assert_test( "REST save_code assigned ID", ! empty( $data['id'] ) );
assert_test( "REST save_code slug is 4jwdh", ( $data['slug'] ?? '' ) === '4jwdh' );
assert_test( "REST save_code short_url uses site domain", strpos( $data['short_url'] ?? '', 'https://jadaan.dev/md/q/4jwdh' ) !== false );

// 4. Test REST API: Get All Codes
$get_req = new WP_REST_Request();
$list_resp = QR_REST::get_codes( $get_req );
$codes_list = $list_resp->data['data'] ?? array();
assert_test( "REST get_codes returns at least 1 record", count( $codes_list ) >= 1 );
assert_test( "REST get_codes record has decoded style_config", is_array( $codes_list[0]->style_config ) );
assert_test( "REST get_codes short_url is populated", ! empty( $codes_list[0]->short_url ) );

// 5. Test Scan Tracking Simulation
$code_id = $data['id'];
$saved_code = $wpdb->get_row( "SELECT * FROM wp_qr_codes WHERE id = $code_id" );
$_SERVER['HTTP_USER_AGENT'] = $iphone_ua;
$_SERVER['HTTP_REFERER'] = 'Camera App';
$_SERVER['REMOTE_ADDR'] = '192.168.1.100';

QR_Redirect::record_scan( $saved_code );

$scan_row = $wpdb->get_row( "SELECT * FROM wp_qr_scans WHERE qr_id = $code_id ORDER BY id DESC LIMIT 1" );
assert_test( "Scan recorded in wp_qr_scans table", ! empty( $scan_row ) );
assert_test( "Scan records device correctly", $scan_row->device === 'Mobile' );
assert_test( "Scan records OS correctly", $scan_row->os === 'iOS' );
assert_test( "Scan anonymizes IP into hash", ! empty( $scan_row->ip_hash ) && strlen( $scan_row->ip_hash ) === 64 );

$updated_code = $wpdb->get_row( "SELECT * FROM wp_qr_codes WHERE id = $code_id" );
assert_test( "QR Code scan counter incremented", (int) $updated_code->scans_count === 1 );

// 6. Test Case-Insensitive Slug Lookup
$lookup_slug = '4Jwdh'; // Uppercase J
$matched_code = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM wp_qr_codes WHERE LOWER(slug) = LOWER(%s) LIMIT 1", $lookup_slug ) );
assert_test( "Case-insensitive lookup matches 4Jwdh with 4jwdh", ! empty( $matched_code ) && $matched_code->id == $code_id );

// 7. Test Analytics Retrieval
$ana_req = new WP_REST_Request( array( 'qr_id' => $code_id ) );
$ana_resp = QR_REST::get_analytics( $ana_req );
$ana_data = $ana_resp->data['data'] ?? array();

assert_test( "Analytics reports total_scans == 1", ( $ana_data['total_scans'] ?? 0 ) === 1 );
assert_test( "Analytics reports unique_scans == 1", ( $ana_data['unique_scans'] ?? 0 ) === 1 );
assert_test( "Analytics reports recent scan entry", count( $ana_data['recent_scans'] ?? array() ) === 1 );

// 8. Editable dynamic links must preserve identity, style and analytics.
$renamed = QR_REST::save_code( new WP_REST_Request( array(
    'id' => $code_id, 'slug' => 'summer-2026', 'title' => 'Summer Campaign',
    'target_url' => 'https://jadaan.dev/new-destination',
    'style_config' => array( 'pattern' => 'dots', 'encodeMode' => 'direct' ),
) ) );
$renamed_data = $renamed->data['data'];
assert_test( 'Rename preserves the code ID', $renamed_data['id'] === $code_id );
assert_test( 'Rename returns the edited short URL', $renamed_data['short_url'] === 'https://jadaan.dev/md/q/summer-2026' );
assert_test( 'Rename saves the destination', $renamed_data['target_url'] === 'https://jadaan.dev/new-destination' );
assert_test( 'Link mode is persisted in style config', $renamed_data['style_config']['encodeMode'] === 'direct' );
assert_test( 'Rename preserves the scan counter', $renamed_data['scans_count'] === 1 );
assert_test( 'Previous link is retired after rename', ! $wpdb->get_var( "SELECT id FROM wp_qr_codes WHERE slug = '4jwdh'" ) );
$history = QR_REST::get_analytics( new WP_REST_Request( array( 'qr_id' => $code_id ) ) )->data['data'];
assert_test( 'Rename preserves analytics by code ID', $history['total_scans'] === 1 && count( $history['recent_scans'] ) === 1 );

// A second code checks real per-code analytics filtering and collision handling.
$second = QR_REST::save_code( new WP_REST_Request( array( 'slug' => 'other-link', 'target_url' => 'https://example.org' ) ) )->data['data'];
QR_Redirect::record_scan( $wpdb->get_row( 'SELECT * FROM wp_qr_codes WHERE id = ' . (int) $second['id'] ) );
$filtered = QR_REST::get_analytics( new WP_REST_Request( array( 'qr_id' => $code_id ) ) )->data['data'];
assert_test( 'Per-code analytics excludes other codes', $filtered['total_scans'] === 1 && count( $filtered['recent_scans'] ) === 1 );
$duplicate = QR_REST::save_code( new WP_REST_Request( array( 'slug' => 'SUMMER-2026', 'target_url' => 'https://example.org' ) ) );
assert_test( 'Duplicate create rejected case-insensitively', $duplicate instanceof WP_Error && $duplicate->data['status'] === 409 );
$collision = QR_REST::save_code( new WP_REST_Request( array( 'id' => $code_id, 'slug' => 'OTHER-LINK', 'target_url' => 'https://example.org' ) ) );
assert_test( 'Duplicate rename rejected case-insensitively', $collision instanceof WP_Error && $collision->code === 'slug_conflict' );
assert_test( 'Rejected rename leaves original link intact', $wpdb->get_var( "SELECT slug FROM wp_qr_codes WHERE id = $code_id" ) === 'summer-2026' );
$same = QR_REST::save_code( new WP_REST_Request( array( 'id' => $code_id, 'slug' => 'summer-2026', 'target_url' => 'https://jadaan.dev/final' ) ) );
assert_test( 'Saving own existing link is allowed', ! ( $same instanceof WP_Error ) );
$omitted = QR_REST::save_code( new WP_REST_Request( array( 'id' => $code_id, 'target_url' => 'https://jadaan.dev/final' ) ) );
assert_test( 'Updates without a slug preserve the link', $omitted->data['data']['slug'] === 'summer-2026' );

foreach ( array( '', 'with space', '../path', 'a/b', 'https://example.org', 'a?b', 'a#b', 'café', str_repeat( 'a', 65 ), array( 'bad' ) ) as $invalid ) {
    $bad = QR_REST::save_code( new WP_REST_Request( array( 'slug' => $invalid, 'target_url' => 'https://example.org' ) ) );
    assert_test( 'Invalid slug rejected: ' . json_encode( $invalid ), $bad instanceof WP_Error && $bad->code === 'invalid_slug' );
}
$boundary = QR_REST::save_code( new WP_REST_Request( array( 'slug' => str_repeat( 'x', 64 ), 'target_url' => 'https://example.org' ) ) );
assert_test( '64-character slug is accepted', strlen( $boundary->data['data']['slug'] ) === 64 );
$generated = QR_REST::save_code( new WP_REST_Request( array( 'target_url' => 'https://example.org' ) ) );
assert_test( 'Missing create slug generates a valid link', preg_match( '/^[a-zA-Z0-9_-]{6}$/', $generated->data['data']['slug'] ) === 1 );
$missing = QR_REST::save_code( new WP_REST_Request( array( 'id' => 999999, 'slug' => 'missing', 'target_url' => 'https://example.org' ) ) );
assert_test( 'Stale IDs do not silently create new codes', $missing instanceof WP_Error && $missing->data['status'] === 404 );
$wpdb->fail_next_write = true;
$failed = QR_REST::save_code( new WP_REST_Request( array( 'slug' => 'failed-insert', 'target_url' => 'https://example.org' ) ) );
assert_test( 'Insert failure does not report success', $failed instanceof WP_Error && $failed->code === 'save_failed' );
$wpdb->fail_next_write = true;
$failed = QR_REST::save_code( new WP_REST_Request( array( 'id' => $code_id, 'slug' => 'failed-update', 'target_url' => 'https://example.org' ) ) );
assert_test( 'Update failure does not report success', $failed instanceof WP_Error && $failed->code === 'save_failed' );

echo "\n====================================================\n";
echo " RESULTS: $tests_passed / $total_tests tests passed successfully!\n";
echo "====================================================\n";
exit( $tests_passed === $total_tests ? 0 : 1 );
