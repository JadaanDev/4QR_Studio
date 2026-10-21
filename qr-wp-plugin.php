<?php
/**
 * Plugin Name: 4QR Studio - Dynamic QR Code Generator & Analytics
 * Plugin URI:  https://github.com/JadaanDev/4QR_Studio
 * Description: High-conversion Dynamic QR Code Generator with custom patterns, corner frames, logos, and real-time scan analytics tracking. Built with React & TailwindCSS.
 * Version:     1.1.0
 * Author:      4QR Studio Team
 * Text Domain: four-qr-studio
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

define( 'QR_PLUGIN_VERSION', '1.1.0' );
define( 'QR_PLUGIN_DB_VERSION', '1.0.0' );
define( 'QR_PLUGIN_FILE', __FILE__ );
define( 'QR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'QR_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Require module files
require_once QR_PLUGIN_DIR . 'includes/class-qr-db.php';
require_once QR_PLUGIN_DIR . 'includes/class-qr-redirect.php';
require_once QR_PLUGIN_DIR . 'includes/class-qr-rest.php';
require_once QR_PLUGIN_DIR . 'includes/class-qr-admin.php';

/**
 * Plugin activation hook.
 */
function qr_plugin_activate() {
    QR_DB::install();
    QR_Redirect::add_rewrite_rules();
    if ( function_exists( 'flush_rewrite_rules' ) ) {
        flush_rewrite_rules( false );
    }
    update_option( 'qr_plugin_installed_version', QR_PLUGIN_VERSION );
}
register_activation_hook( __FILE__, 'qr_plugin_activate' );

/**
 * Plugin deactivation hook.
 */
function qr_plugin_deactivate() {
    if ( function_exists( 'flush_rewrite_rules' ) ) {
        flush_rewrite_rules( false );
    }
}
register_deactivation_hook( __FILE__, 'qr_plugin_deactivate' );

/**
 * Bootstrap the plugin components.
 */
function qr_plugin_init() {
    // Auto-verify DB tables
    QR_DB::check_and_install();

    QR_Redirect::init();
    QR_REST::init();
    QR_Admin::init();
}
add_action( 'plugins_loaded', 'qr_plugin_init' );

/**
 * Safe rewrite rule flushing on 'init' hook (WordPress lifecycle safe).
 */
add_action( 'init', function() {
    if ( get_option( 'qr_plugin_installed_version' ) !== QR_PLUGIN_VERSION ) {
        QR_Redirect::add_rewrite_rules();
        if ( function_exists( 'flush_rewrite_rules' ) ) {
            flush_rewrite_rules( false );
        }
        update_option( 'qr_plugin_installed_version', QR_PLUGIN_VERSION );
    }
}, 99 );
