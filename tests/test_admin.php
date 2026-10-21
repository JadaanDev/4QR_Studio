<?php
/** WordPress hook, access and public redirect smoke tests without a live site. */
define( 'ABSPATH', __DIR__ . '/fixtures/' );
$hooks = array();
$routes = array();
$assets = array();
$localized = array();
$shortcodes = array();
$capabilities = array();
$query_slug = '';
$passed = 0;
$total = 0;

function plugin_dir_path( $file ) { return dirname( $file ) . '/'; }
function plugin_dir_url( $file ) { return 'https://example.org/wp-content/plugins/qr-wp-plugin/'; }
function add_action( $hook, $callback, $priority = 10, $args = 1 ) { global $hooks; $hooks[$hook][] = $callback; }
function add_filter( $hook, $callback, $priority = 10, $args = 1 ) { add_action( $hook, $callback, $priority, $args ); }
function register_activation_hook( $file, $callback ) {}
function register_deactivation_hook( $file, $callback ) {}
function add_shortcode( $name, $callback ) { global $shortcodes; $shortcodes[$name] = $callback; }
function get_option( $name ) { return 'qr_plugin_db_installed' === $name ? QR_PLUGIN_DB_VERSION : QR_PLUGIN_VERSION; }
function current_user_can( $cap ) { global $capabilities; return ! empty( $capabilities[$cap] ); }
function __( $text, $domain ) { return $text; }
function esc_html__( $text, $domain ) { return $text; }
function esc_html( $value ) { return htmlspecialchars( $value, ENT_QUOTES ); }
function esc_url( $value ) { return $value; }
function esc_url_raw( $value ) { return $value; }
function sanitize_text_field( $value ) { return trim( strip_tags( $value ) ); }
function wp_unslash( $value ) { return $value; }
function home_url() { return 'https://example.org/site'; }
function admin_url() { return 'https://example.org/site/wp-admin/'; }
function rest_url( $path ) { return home_url() . '/wp-json/' . $path; }
function wp_create_nonce( $action ) { return 'nonce-for-' . $action; }
function wp_salt( $scheme ) { return 'test-salt'; }
function current_time( $type ) { return '2026-10-21 12:00:00'; }
function get_query_var( $name ) { global $query_slug; return $query_slug; }
function add_rewrite_rule( $pattern, $target, $position ) { global $rewrite; $rewrite = array( $pattern, $target, $position ); }
function add_menu_page( ...$args ) { global $menus; $menus[] = $args; }
function add_submenu_page( ...$args ) { global $menus; $menus[] = $args; }
function wp_enqueue_style( ...$args ) { global $assets; $assets[] = $args; }
function wp_enqueue_script( ...$args ) { global $assets; $assets[] = $args; }
function wp_localize_script( $handle, $name, $data ) { global $localized; $localized[$name] = $data; }
function register_rest_route( $namespace, $route, $args ) { global $routes; $routes[] = $args; }
class WP_REST_Server { const READABLE = 'GET'; const CREATABLE = 'POST'; const DELETABLE = 'DELETE'; }
class TestRedirect extends Exception { public $target; public $status; }
class TestDie extends Exception { public $status; }
function wp_redirect( $target, $status ) {
    $exception = new TestRedirect(); $exception->target = $target; $exception->status = $status; throw $exception;
}
function wp_die( $message, $title = '', $args = array() ) {
    $exception = new TestDie(); $exception->status = $args['response']; throw $exception;
}

class RedirectDB {
    public $prefix = 'wp_';
    public $code;
    public $scans = array();
    public $updates = 0;
    public function get_row( $sql ) { return $this->code; }
    public function prepare( $sql, ...$args ) { return $sql; }
    public function insert( $table, $data, $formats ) { $this->scans[] = $data; return 1; }
    public function query( $sql ) { $this->updates++; return 1; }
}
$wpdb = new RedirectDB();

function check( $label, $condition ) {
    global $passed, $total;
    $total++;
    if ( $condition ) $passed++;
    echo ( $condition ? '[PASS] ' : '[FAIL] ' ) . $label . "\n";
}

require __DIR__ . '/../qr-wp-plugin.php';
qr_plugin_init();
check( 'Management assets load through admin hook only', isset( $hooks['admin_enqueue_scripts'] ) && ! isset( $hooks['wp_enqueue_scripts'] ) );
check( 'No shortcodes registered', empty( $shortcodes ) );
check( 'Removed shortcode implementation is absent', ! file_exists( QR_PLUGIN_DIR . 'includes/class-qr-shortcode.php' ) );
check( 'Public redirect remains registered', in_array( array( 'QR_Redirect', 'handle_redirect' ), $hooks['template_redirect'], true ) );
QR_Admin::add_admin_menu();
check( 'Admin menu includes settings and help', count( $menus ) === 5 );
foreach ( $menus as $menu ) {
    check( 'Admin menu requires edit_posts', in_array( 'edit_posts', $menu, true ) );
}
QR_Admin::enqueue_assets( 'dashboard' );
check( 'Unrelated admin screens receive no plugin assets', empty( $assets ) );
QR_Admin::enqueue_assets( 'toplevel_page_qr-studio' );
check( 'Plugin admin assets are enqueued', count( $assets ) >= 2 );
check( 'Bootstrap is explicitly admin-only', $localized['qrStudioData']['isAdmin'] === true );
check( 'REST nonce is provided', $localized['qrStudioData']['nonce'] === 'nonce-for-wp_rest' );

try { QR_Admin::render_app_page(); check( 'Unauthorized admin render denied', false ); }
catch ( TestDie $error ) { check( 'Unauthorized admin render denied', $error->status === 403 ); }
check( 'Signed-out REST access denied', ! QR_REST::check_permission() );
$capabilities = array( 'read' => true );
check( 'Subscriber REST access denied', ! QR_REST::check_permission() );
$capabilities = array( 'edit_posts' => true );
check( 'Editor REST access allowed', QR_REST::check_permission() );
QR_REST::register_routes();
foreach ( $routes as $route ) {
    foreach ( isset( $route['methods'] ) ? array( $route ) : $route as $endpoint ) {
        check( 'REST endpoint has a capability callback', $endpoint['permission_callback'] === array( 'QR_REST', 'check_permission' ) );
    }
}

$capabilities = array();
$query_slug = 'test-link';
$wpdb->code = null;
try { QR_Redirect::handle_redirect(); check( 'Missing public code is 404', false ); }
catch ( TestDie $error ) { check( 'Missing public code is 404', $error->status === 404 ); }
$wpdb->code = (object) array( 'id' => 1, 'slug' => 'test-link', 'target_url' => 'example.org/promo', 'is_active' => 0 );
try { QR_Redirect::handle_redirect(); check( 'Paused public code is 404', false ); }
catch ( TestDie $error ) { check( 'Paused public code is 404', $error->status === 404 ); }
check( 'Unavailable codes do not log visits', empty( $wpdb->scans ) );
$wpdb->code->is_active = 1;
$_SERVER['REMOTE_ADDR'] = '192.0.2.1';
$_SERVER['HTTP_USER_AGENT'] = 'Example mobile iPhone Safari';
try { QR_Redirect::handle_redirect(); check( 'Active code redirects for signed-out visitors', false ); }
catch ( TestRedirect $redirect ) {
    check( 'Active code redirects for signed-out visitors', $redirect->status === 302 && $redirect->target === 'https://example.org/promo' );
}
check( 'Real redirect records a scan and counter update', count( $wpdb->scans ) === 1 && $wpdb->updates === 1 );
check( 'Redirect stores a salted hash instead of raw IP', strlen( $wpdb->scans[0]['ip_hash'] ) === 64 && ! isset( $wpdb->scans[0]['ip'] ) );
$query_slug = '';
$_GET['qr'] = 'test-link';
try { QR_Redirect::handle_redirect(); check( 'Query-parameter redirect fallback works', false ); }
catch ( TestRedirect $redirect ) { check( 'Query-parameter redirect fallback works', $redirect->status === 302 ); }
$_GET = array();
$_SERVER['REQUEST_URI'] = '/site/q/test-link';
try { QR_Redirect::handle_redirect(); check( 'Subdirectory redirect fallback works', false ); }
catch ( TestRedirect $redirect ) { check( 'Subdirectory redirect fallback works', $redirect->status === 302 ); }

echo "Admin and redirect checks: $passed / $total passed\n";
exit( $passed === $total ? 0 : 1 );
