<?php
/**
 * Shortcode handlers for frontend embedding.
 */

defined( 'ABSPATH' ) || exit;

class QR_Shortcode {

    public static function init() {
        add_shortcode( 'qr_generator', array( __CLASS__, 'render_generator_shortcode' ) );
        add_shortcode( 'qr_analytics', array( __CLASS__, 'render_analytics_shortcode' ) );
        add_filter( 'script_loader_tag', array( __CLASS__, 'add_module_type_to_script' ), 10, 3 );
    }

    public static function enqueue_frontend_assets() {
        $dist_dir = QR_PLUGIN_DIR . 'dist/';
        $dist_url = QR_PLUGIN_URL . 'dist/';

        $js_rel  = file_exists( $dist_dir . 'assets/index.js' ) ? 'assets/index.js' : '';
        $css_rel = file_exists( $dist_dir . 'assets/index.css' ) ? 'assets/index.css' : '';

        if ( ! $js_rel && is_dir( $dist_dir . 'assets' ) ) {
            foreach ( scandir( $dist_dir . 'assets' ) as $file ) {
                if ( preg_match( '/^index.*\.js$/i', $file ) ) {
                    $js_rel = 'assets/' . $file;
                    break;
                }
            }
        }
        if ( ! $css_rel && is_dir( $dist_dir . 'assets' ) ) {
            foreach ( scandir( $dist_dir . 'assets' ) as $file ) {
                if ( preg_match( '/^index.*\.css$/i', $file ) ) {
                    $css_rel = 'assets/' . $file;
                    break;
                }
            }
        }

        // Enqueue 4QR Studio Jadaan.Dev Design System
        $assets_url = QR_PLUGIN_URL . 'assets/';
        if ( file_exists( QR_PLUGIN_DIR . 'assets/tokens.css' ) ) {
            wp_enqueue_style( '4qr-tokens', $assets_url . 'tokens.css', array(), QR_PLUGIN_VERSION );
        }
        if ( file_exists( QR_PLUGIN_DIR . 'assets/fonts.css' ) ) {
            wp_enqueue_style( '4qr-fonts', $assets_url . 'fonts.css', array(), QR_PLUGIN_VERSION );
        }
        if ( file_exists( QR_PLUGIN_DIR . 'assets/components.css' ) ) {
            wp_enqueue_style( '4qr-components', $assets_url . 'components.css', array(), QR_PLUGIN_VERSION );
        }
        if ( file_exists( QR_PLUGIN_DIR . 'assets/admin-overrides.css' ) ) {
            wp_enqueue_style( '4qr-admin-overrides', $assets_url . 'admin-overrides.css', array(), QR_PLUGIN_VERSION );
        }

        if ( $css_rel && file_exists( $dist_dir . $css_rel ) ) {
            wp_enqueue_style( 'qr-studio-app-css', $dist_url . $css_rel, array(), QR_PLUGIN_VERSION );
        }

        if ( $js_rel && file_exists( $dist_dir . $js_rel ) ) {
            wp_enqueue_script( 'qr-studio-app-js', $dist_url . $js_rel, array(), QR_PLUGIN_VERSION, true );

            wp_localize_script( 'qr-studio-app-js', 'qrStudioData', array(
                'isWp'       => true,
                'isAdmin'    => false,
                'isFrontend' => true,
                'restUrl'    => esc_url_raw( rest_url( 'qr-studio/v1/' ) ),
                'nonce'      => wp_create_nonce( 'wp_rest' ),
                'siteUrl'    => home_url(),
                'adminUrl'   => admin_url(),
            ) );
        }
    }

    public static function add_module_type_to_script( $tag, $handle, $src ) {
        if ( 'qr-studio-app-js' === $handle ) {
            return '<script type="module" src="' . esc_url( $src ) . '"></script>' . "\n";
        }
        return $tag;
    }

    public static function render_generator_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'takeover' => 'true',
        ), $atts, 'qr_generator' );

        self::enqueue_frontend_assets();

        $takeover_class = ( 'false' !== $atts['takeover'] ) ? 'qr-studio-fullscreen-takeover' : '';
        return '<div id="qr-studio-root" data-view="generator" data-takeover="' . esc_attr( $atts['takeover'] ) . '" class="qr-studio-embed ' . esc_attr( $takeover_class ) . '"></div>';
    }

    public static function render_analytics_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'takeover' => 'true',
        ), $atts, 'qr_analytics' );

        self::enqueue_frontend_assets();

        $takeover_class = ( 'false' !== $atts['takeover'] ) ? 'qr-studio-fullscreen-takeover' : '';
        return '<div id="qr-studio-root" data-view="analytics" data-takeover="' . esc_attr( $atts['takeover'] ) . '" class="qr-studio-embed ' . esc_attr( $takeover_class ) . '"></div>';
    }
}
