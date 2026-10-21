<?php
/**
 * REST API Endpoints for QR Studio.
 */

defined( 'ABSPATH' ) || exit;

class QR_REST {

    const NAMESPACE = 'qr-studio/v1';

    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    public static function register_routes() {
        // List & Create QR codes
        register_rest_route( self::NAMESPACE, '/codes', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( __CLASS__, 'get_codes' ),
                'permission_callback' => array( __CLASS__, 'check_permission' ),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( __CLASS__, 'save_code' ),
                'permission_callback' => array( __CLASS__, 'check_permission' ),
            ),
        ) );

        // Single QR code
        register_rest_route( self::NAMESPACE, '/codes/(?P<id>\d+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( __CLASS__, 'get_code' ),
                'permission_callback' => array( __CLASS__, 'check_permission' ),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array( __CLASS__, 'delete_code' ),
                'permission_callback' => array( __CLASS__, 'check_permission' ),
            ),
        ) );

        // Analytics
        register_rest_route( self::NAMESPACE, '/analytics', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_analytics' ),
            'permission_callback' => array( __CLASS__, 'check_permission' ),
        ) );
    }

    public static function check_permission() {
        return current_user_can( 'edit_posts' ) || current_user_can( 'manage_options' );
    }

    private static function get_req_param( $request, $key, $default = null ) {
        if ( is_object( $request ) && method_exists( $request, 'get_param' ) ) {
            $val = $request->get_param( $key );
            if ( $val !== null ) return $val;
        }
        if ( is_array( $request ) && isset( $request[$key] ) ) {
            return $request[$key];
        }
        return $default;
    }

    public static function get_codes( $request ) {
        global $wpdb;
        $table = QR_DB::get_codes_table();
        $results = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC" );

        if ( ! is_array( $results ) ) {
            $results = array();
        }

        $site_url = function_exists( 'home_url' ) ? home_url() : '';

        $codes = array_map( function( $row ) use ( $site_url ) {
            $row->style_config = json_decode( $row->style_config, true );
            $row->short_url    = ( function_exists( 'trailingslashit' ) ? trailingslashit( $site_url ) : $site_url . '/' ) . 'q/' . $row->slug;
            return $row;
        }, $results );

        return rest_ensure_response( array( 'success' => true, 'data' => $codes ) );
    }

    public static function get_code( $request ) {
        global $wpdb;
        $id = (int) self::get_req_param( $request, 'id', 0 );
        $table = QR_DB::get_codes_table();

        $code = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ) );
        if ( ! $code ) {
            return new WP_Error( 'not_found', 'QR code not found', array( 'status' => 404 ) );
        }

        $site_url = function_exists( 'home_url' ) ? home_url() : '';
        $code->style_config = json_decode( $code->style_config, true );
        $code->short_url    = ( function_exists( 'trailingslashit' ) ? trailingslashit( $site_url ) : $site_url . '/' ) . 'q/' . $code->slug;

        return rest_ensure_response( array( 'success' => true, 'data' => $code ) );
    }

    public static function save_code( $request ) {
        global $wpdb;
        $params = is_object( $request ) && method_exists( $request, 'get_json_params' ) 
            ? (array) $request->get_json_params() 
            : (array) $request;

        if ( empty( $params ) && is_object( $request ) && method_exists( $request, 'get_params' ) ) {
            $params = (array) $request->get_params();
        }

        $table = QR_DB::get_codes_table();

        $id           = ! empty( $params['id'] ) ? (int) $params['id'] : 0;
        $title        = ! empty( $params['title'] ) ? sanitize_text_field( $params['title'] ) : 'Untitled QR';
        $qr_type      = ! empty( $params['qr_type'] ) ? sanitize_text_field( $params['qr_type'] ) : 'website';
        $target_url   = ! empty( $params['target_url'] ) ? sanitize_text_field( $params['target_url'] ) : '';
        $style_config = ! empty( $params['style_config'] ) ? wp_json_encode( $params['style_config'] ) : '{}';
        $is_active    = isset( $params['is_active'] ) ? (int) (bool) $params['is_active'] : 1;

        if ( empty( $target_url ) ) {
            return new WP_Error( 'missing_url', 'Target URL or content is required', array( 'status' => 400 ) );
        }

        // Keep the existing code ID so renames retain their scan history.
        $existing = null;
        if ( $id > 0 ) {
            $existing = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ) );
            if ( ! $existing ) {
                return new WP_Error( 'not_found', 'QR code not found. Reload My Codes and try again.', array( 'status' => 404 ) );
            }
        }

        if ( array_key_exists( 'slug', $params ) ) {
            if ( ! is_string( $params['slug'] ) || ! preg_match( '/\A[a-zA-Z0-9_-]{1,64}\z/', $params['slug'] ) ) {
                return new WP_Error( 'invalid_slug', 'Use 1–64 letters, numbers, hyphens or underscores for the QR Code Link.', array( 'status' => 400 ) );
            }
            $slug = $params['slug'];
        } elseif ( $existing ) {
            $slug = $existing->slug;
        } else {
            do {
                $slug = wp_generate_password( 6, false );
            } while ( $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE LOWER(slug) = LOWER(%s)", $slug ) ) );
        }

        // Redirects are case-insensitive, so uniqueness checks must be too.
        $conflict = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE LOWER(slug) = LOWER(%s) AND id <> %d",
            $slug, $id
        ) );
        if ( $conflict ) {
            return new WP_Error( 'slug_conflict', 'This QR Code Link is already in use. Choose another link.', array( 'status' => 409 ) );
        }

        if ( $id > 0 ) {
            // Update
            $result = $wpdb->update(
                $table,
                array(
                    'slug'         => $slug,
                    'title'        => $title,
                    'qr_type'      => $qr_type,
                    'target_url'   => $target_url,
                    'style_config' => $style_config,
                    'is_active'    => $is_active,
                ),
                array( 'id' => $id )
            );
        } else {
            // Insert
            $result = $wpdb->insert(
                $table,
                array(
                    'slug'         => $slug,
                    'title'        => $title,
                    'qr_type'      => $qr_type,
                    'target_url'   => $target_url,
                    'style_config' => $style_config,
                    'is_active'    => $is_active,
                    'created_at'   => function_exists( 'current_time' ) ? current_time( 'mysql' ) : date( 'Y-m-d H:i:s' ),
                )
            );
            $id = (int) $wpdb->insert_id;
        }

        if ( false === $result ) {
            return new WP_Error( 'save_failed', 'Could not save this QR code. The link may have just been taken; try again.', array( 'status' => 500 ) );
        }

        $site_url = function_exists( 'home_url' ) ? home_url() : '';
        $short_url = ( function_exists( 'trailingslashit' ) ? trailingslashit( $site_url ) : $site_url . '/' ) . 'q/' . $slug;
        $scans_count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT scans_count FROM {$table} WHERE id = %d", $id ) );

        return rest_ensure_response( array(
            'success' => true,
            'data'    => array(
                'id'           => $id,
                'slug'         => $slug,
                'title'        => $title,
                'qr_type'      => $qr_type,
                'target_url'   => $target_url,
                'style_config' => json_decode( $style_config, true ),
                'scans_count'  => $scans_count,
                'is_active'    => (bool) $is_active,
                'short_url'    => $short_url,
            ),
        ) );
    }

    public static function delete_code( $request ) {
        global $wpdb;
        $id = (int) self::get_req_param( $request, 'id', 0 );

        $codes_table = QR_DB::get_codes_table();
        $scans_table = QR_DB::get_scans_table();

        $wpdb->delete( $codes_table, array( 'id' => $id ) );
        $wpdb->delete( $scans_table, array( 'qr_id' => $id ) );

        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function get_analytics( $request ) {
        global $wpdb;
        $codes_table = QR_DB::get_codes_table();
        $scans_table = QR_DB::get_scans_table();

        $qr_id = (int) self::get_req_param( $request, 'qr_id', 0 );
        $where_scan = $qr_id > 0 ? $wpdb->prepare( "WHERE qr_id = %d", $qr_id ) : "";

        // Total scans
        $total_scans = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$scans_table} {$where_scan}" );

        // Unique visitors (by ip_hash)
        $unique_scans = (int) $wpdb->get_var( "SELECT COUNT(DISTINCT ip_hash) FROM {$scans_table} {$where_scan}" );

        // Devices
        $devices = $wpdb->get_results( "SELECT device as name, COUNT(*) as count FROM {$scans_table} {$where_scan} GROUP BY device ORDER BY count DESC" );
        $devices = is_array( $devices ) ? $devices : array();

        // Operating Systems
        $os_list = $wpdb->get_results( "SELECT os as name, COUNT(*) as count FROM {$scans_table} {$where_scan} GROUP BY os ORDER BY count DESC" );
        $os_list = is_array( $os_list ) ? $os_list : array();

        // Browsers
        $browsers = $wpdb->get_results( "SELECT browser as name, COUNT(*) as count FROM {$scans_table} {$where_scan} GROUP BY browser ORDER BY count DESC" );
        $browsers = is_array( $browsers ) ? $browsers : array();

        // Daily scans
        $daily = $wpdb->get_results(
            "SELECT DATE(scanned_at) as date, COUNT(*) as count 
             FROM {$scans_table} 
             {$where_scan} 
             GROUP BY DATE(scanned_at) 
             ORDER BY date ASC"
        );
        $daily = is_array( $daily ) ? $daily : array();

        // Recent 50 scan records
        $recent_scans = $wpdb->get_results(
            "SELECT s.*, c.title as qr_title 
             FROM {$scans_table} s 
             LEFT JOIN {$codes_table} c ON s.qr_id = c.id 
             {$where_scan} 
             ORDER BY s.scanned_at DESC 
             LIMIT 50"
        );
        $recent_scans = is_array( $recent_scans ) ? $recent_scans : array();

        return rest_ensure_response( array(
            'success' => true,
            'data'    => array(
                'total_scans'  => $total_scans,
                'unique_scans' => $unique_scans,
                'devices'      => $devices,
                'os'           => $os_list,
                'browsers'     => $browsers,
                'daily'        => $daily,
                'recent_scans' => $recent_scans,
            ),
        ) );
    }
}
