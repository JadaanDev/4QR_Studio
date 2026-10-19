<?php
/**
 * Admin interface and asset enqueueing.
 */

defined( 'ABSPATH' ) || exit;

class QR_Admin {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
        add_filter( 'script_loader_tag', array( __CLASS__, 'add_module_type_to_script' ), 10, 3 );
    }

    public static function add_admin_menu() {
        add_menu_page(
            __( '4QR Studio', 'four-qr-studio' ),
            __( '4QR Studio', 'four-qr-studio' ),
            'edit_posts',
            'qr-studio',
            array( __CLASS__, 'render_app_page' ),
            'dashicons-format-image',
            26
        );

        add_submenu_page(
            'qr-studio',
            __( 'Generator', 'qr-studio' ),
            __( 'Generator', 'qr-studio' ),
            'edit_posts',
            'qr-studio',
            array( __CLASS__, 'render_app_page' )
        );

        add_submenu_page(
            'qr-studio',
            __( 'Analytics', 'qr-studio' ),
            __( 'Analytics', 'qr-studio' ),
            'edit_posts',
            'admin.php?page=qr-studio#/analytics'
        );

        add_submenu_page(
            'qr-studio',
            __( 'My QR Codes', 'qr-studio' ),
            __( 'My QR Codes', 'qr-studio' ),
            'edit_posts',
            'admin.php?page=qr-studio#/codes'
        );
    }

    public static function enqueue_assets( $hook ) {
        if ( strpos( $hook, 'qr-studio' ) === false ) {
            return;
        }

        $dist_dir = QR_PLUGIN_DIR . 'dist/';
        $dist_url = QR_PLUGIN_URL . 'dist/';

        $js_rel  = file_exists( $dist_dir . 'assets/index.js' ) ? 'assets/index.js' : '';
        $css_rel = file_exists( $dist_dir . 'assets/index.css' ) ? 'assets/index.css' : '';

        // Fallback scan if hashes used
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

        if ( $css_rel && file_exists( $dist_dir . $css_rel ) ) {
            wp_enqueue_style( 'qr-studio-app-css', $dist_url . $css_rel, array(), QR_PLUGIN_VERSION );
        }

        if ( $js_rel && file_exists( $dist_dir . $js_rel ) ) {
            wp_enqueue_script( 'qr-studio-app-js', $dist_url . $js_rel, array(), QR_PLUGIN_VERSION, true );

            wp_localize_script( 'qr-studio-app-js', 'qrStudioData', array(
                'isWp'     => true,
                'restUrl'  => esc_url_raw( rest_url( 'qr-studio/v1/' ) ),
                'nonce'    => wp_create_nonce( 'wp_rest' ),
                'siteUrl'  => home_url(),
                'adminUrl' => admin_url(),
            ) );
        }
    }

    public static function add_module_type_to_script( $tag, $handle, $src ) {
        if ( 'qr-studio-app-js' === $handle ) {
            return '<script type="module" src="' . esc_url( $src ) . '"></script>' . "\n";
        }
        return $tag;
    }

    public static function render_app_page() {
        $dist_dir = QR_PLUGIN_DIR . 'dist/';
        $has_build = file_exists( $dist_dir . 'assets/index.js' );

        ?>
        <div class="wrap" style="margin: 0; padding: 20px 20px 40px 0;">
            <div id="qr-studio-root">
                <?php if ( ! $has_build ) : ?>
                    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); max-width: 700px; margin: 40px auto; font-family: sans-serif; text-align: center;">
                        <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 12px;">QR Studio Assets Not Built Yet</h2>
                        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                            Please run <code>npm run build</code> inside the plugin folder to compile the React and Tailwind assets.
                        </p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: left; font-family: monospace; font-size: 13px; color: #0f172a;">
                            cd <?php echo esc_html( QR_PLUGIN_DIR ); ?><br>
                            npm run build
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}
