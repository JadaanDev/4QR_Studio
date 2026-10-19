<?php
/**
 * Database schema and setup for 4QR Studio.
 */

defined( 'ABSPATH' ) || exit;

class QR_DB {

    public static function get_codes_table() {
        global $wpdb;
        return $wpdb->prefix . 'qr_codes';
    }

    public static function get_scans_table() {
        global $wpdb;
        return $wpdb->prefix . 'qr_scans';
    }

    public static function check_and_install() {
        global $wpdb;
        if ( get_option( 'qr_plugin_db_installed' ) !== QR_PLUGIN_DB_VERSION ) {
            self::install();
            update_option( 'qr_plugin_db_installed', QR_PLUGIN_DB_VERSION );
        }
    }

    public static function install() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $codes_table = self::get_codes_table();
        $scans_table = self::get_scans_table();

        // Direct fail-safe SQL execution (clean tables, no seeding)
        $sql_codes = "CREATE TABLE IF NOT EXISTS {$codes_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            slug varchar(64) NOT NULL,
            title varchar(255) NOT NULL DEFAULT 'Untitled QR',
            qr_type varchar(50) NOT NULL DEFAULT 'website',
            target_url text NOT NULL,
            style_config longtext NOT NULL,
            scans_count int(11) unsigned NOT NULL DEFAULT 0,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug_unique (slug),
            KEY active_idx (is_active)
        ) {$charset_collate};";

        $sql_scans = "CREATE TABLE IF NOT EXISTS {$scans_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            qr_id bigint(20) unsigned NOT NULL,
            slug varchar(64) NOT NULL,
            ip_hash varchar(64) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            device varchar(50) DEFAULT 'Desktop',
            os varchar(50) DEFAULT 'Unknown',
            browser varchar(50) DEFAULT 'Unknown',
            referrer varchar(255) DEFAULT '',
            scanned_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY qr_idx (qr_id),
            KEY slug_idx (slug),
            KEY scanned_idx (scanned_at)
        ) {$charset_collate};";

        $wpdb->query( $sql_codes );
        $wpdb->query( $sql_scans );

        // Also run dbDelta if upgrade.php is available
        if ( defined( 'ABSPATH' ) && file_exists( ABSPATH . 'wp-admin/includes/upgrade.php' ) ) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            if ( function_exists( 'dbDelta' ) ) {
                $delta_codes = "CREATE TABLE {$codes_table} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  slug varchar(64) NOT NULL,
  title varchar(255) NOT NULL DEFAULT 'Untitled QR',
  qr_type varchar(50) NOT NULL DEFAULT 'website',
  target_url text NOT NULL,
  style_config longtext NOT NULL,
  scans_count int(11) unsigned NOT NULL DEFAULT 0,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  UNIQUE KEY slug_unique (slug),
  KEY active_idx (is_active)
) {$charset_collate};";

                $delta_scans = "CREATE TABLE {$scans_table} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  qr_id bigint(20) unsigned NOT NULL,
  slug varchar(64) NOT NULL,
  ip_hash varchar(64) DEFAULT NULL,
  user_agent text DEFAULT NULL,
  device varchar(50) DEFAULT 'Desktop',
  os varchar(50) DEFAULT 'Unknown',
  browser varchar(50) DEFAULT 'Unknown',
  referrer varchar(255) DEFAULT '',
  scanned_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY qr_idx (qr_id),
  KEY slug_idx (slug),
  KEY scanned_idx (scanned_at)
) {$charset_collate};";

                dbDelta( $delta_codes );
                dbDelta( $delta_scans );
            }
        }

        update_option( 'qr_plugin_db_version', QR_PLUGIN_DB_VERSION );
    }
}
