<?php
/**
 * Redirect and scan tracking engine.
 */

defined( 'ABSPATH' ) || exit;

class QR_Redirect {

    public static function init() {
        add_action( 'init', array( __CLASS__, 'add_rewrite_rules' ) );
        add_filter( 'query_vars', array( __CLASS__, 'add_query_vars' ) );
        add_action( 'template_redirect', array( __CLASS__, 'handle_redirect' ) );
    }

    public static function add_rewrite_rules() {
        add_rewrite_rule( '^q/([a-zA-Z0-9_-]+)/?$', 'index.php?qr_slug=$matches[1]', 'top' );
    }

    public static function add_query_vars( $vars ) {
        $vars[] = 'qr_slug';
        return $vars;
    }

    public static function handle_redirect() {
        $slug = get_query_var( 'qr_slug' );

        // Fallback to query parameter ?qr=SLUG or ?qr_slug=SLUG
        if ( empty( $slug ) && ! empty( $_GET['qr'] ) ) {
            $slug = sanitize_text_field( wp_unslash( $_GET['qr'] ) );
        }
        if ( empty( $slug ) && ! empty( $_GET['qr_slug'] ) ) {
            $slug = sanitize_text_field( wp_unslash( $_GET['qr_slug'] ) );
        }

        // Also check REQUEST_URI directly as a robust fallback for subdirectory installs
        if ( empty( $slug ) && ! empty( $_SERVER['REQUEST_URI'] ) ) {
            $uri_path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
            if ( preg_match( '#/q/([a-zA-Z0-9_-]+)/?$#i', $uri_path, $matches ) ) {
                $slug = $matches[1];
            }
        }

        if ( empty( $slug ) ) {
            return;
        }

        $slug = trim( rtrim( $slug, '/' ) );

        global $wpdb;
        $codes_table = QR_DB::get_codes_table();

        // Ensure tables exist
        QR_DB::check_and_install();

        // Case-insensitive slug query
        $code = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$codes_table} WHERE LOWER(slug) = LOWER(%s) LIMIT 1",
            $slug
        ) );

        if ( ! $code || ! (int) $code->is_active ) {
            wp_die(
                '<div style="text-align:center; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">' .
                '<h2 style="font-size: 24px; color: #1e293b; margin-bottom: 8px;">QR Code Unavailable</h2>' .
                '<p style="color: #64748b; font-size: 15px; margin-bottom: 24px;">The requested QR code <strong>' . esc_html( $slug ) . '</strong> does not exist or has been paused.</p>' .
                '<a href="' . esc_url( home_url() ) . '" style="display:inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Return to Home</a>' .
                '</div>',
                'QR Code Unavailable',
                array( 'response' => 404 )
            );
        }

        // Track Scan
        self::record_scan( $code );

        // Target URL
        $target = trim( $code->target_url );
        if ( ! preg_match( '#^https?://#i', $target ) && ! preg_match( '#^(tel|mailto|sms|geo):#i', $target ) ) {
            $target = 'https://' . $target;
        }

        wp_redirect( esc_url_raw( $target ), 302 );
        exit;
    }

    public static function record_scan( $code ) {
        global $wpdb;

        $scans_table = QR_DB::get_scans_table();
        $codes_table = QR_DB::get_codes_table();

        $user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
        $referrer   = isset( $_SERVER['HTTP_REFERER'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : '';
        $ip         = self::get_ip_address();
        $ip_hash    = ! empty( $ip ) ? hash( 'sha256', $ip . wp_salt( 'auth' ) ) : null;

        $parsed = self::parse_user_agent( $user_agent );

        $wpdb->insert(
            $scans_table,
            array(
                'qr_id'      => $code->id,
                'slug'       => $code->slug,
                'ip_hash'    => $ip_hash,
                'user_agent' => substr( $user_agent, 0, 500 ),
                'device'     => $parsed['device'],
                'os'         => $parsed['os'],
                'browser'    => $parsed['browser'],
                'referrer'   => substr( $referrer, 0, 255 ),
                'scanned_at' => current_time( 'mysql' ),
            ),
            array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
        );

        $wpdb->query( $wpdb->prepare(
            "UPDATE {$codes_table} SET scans_count = scans_count + 1 WHERE id = %d",
            $code->id
        ) );
    }

    public static function get_ip_address() {
        foreach ( array( 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' ) as $key ) {
            if ( ! empty( $_SERVER[ $key ] ) ) {
                $ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
                return trim( $ips[0] );
            }
        }
        return '';
    }

    public static function parse_user_agent( $ua ) {
        $device  = 'Desktop';
        $os      = 'Other';
        $browser = 'Other';

        // Device
        if ( preg_match( '/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua ) ) {
            $device = 'Tablet';
        } elseif ( preg_match( '/(android|mobile|iphone|ipod|blackberry|iemobile|opera mini)/i', $ua ) ) {
            $device = 'Mobile';
        }

        // OS
        if ( preg_match( '/iphone|ipad|ipod/i', $ua ) ) {
            $os = 'iOS';
        } elseif ( preg_match( '/android/i', $ua ) ) {
            $os = 'Android';
        } elseif ( preg_match( '/windows nt 10/i', $ua ) ) {
            $os = 'Windows 10/11';
        } elseif ( preg_match( '/windows/i', $ua ) ) {
            $os = 'Windows';
        } elseif ( preg_match( '/macintosh|mac os x/i', $ua ) ) {
            $os = 'macOS';
        } elseif ( preg_match( '/linux/i', $ua ) ) {
            $os = 'Linux';
        }

        // Browser
        if ( preg_match( '/edg/i', $ua ) ) {
            $browser = 'Edge';
        } elseif ( preg_match( '/chrome|crios/i', $ua ) && ! preg_match( '/opr|edg/i', $ua ) ) {
            $browser = 'Chrome';
        } elseif ( preg_match( '/safari/i', $ua ) && ! preg_match( '/chrome|crios|opr|edg/i', $ua ) ) {
            $browser = 'Safari';
        } elseif ( preg_match( '/firefox|fxios/i', $ua ) ) {
            $browser = 'Firefox';
        } elseif ( preg_match( '/opr|opera/i', $ua ) ) {
            $browser = 'Opera';
        }

        return compact( 'device', 'os', 'browser' );
    }
}
