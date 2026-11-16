<?php
/**
 * Bare template for the "Full-screen chat page (mobile app)": no theme header, menu, content or footer,
 * only wp_head()/wp_footer() so the chat's script and style (and other plugins' required output) load.
 * The chat root is printed in wp_footer (includes/render.php).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
// Block themes add their own viewport tag from wp_head; this template prints its own (with viewport-fit for notches)
remove_action( 'wp_head', '_block_template_viewport_meta_tag', 0 );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'wpc-fullscreen-page' ); ?>>
<?php
if ( function_exists( 'wp_body_open' ) ) {
	wp_body_open();
}
wp_footer();
?>
</body>
</html>
