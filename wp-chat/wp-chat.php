<?php
/**
 * Plugin Name:       WP Chat
 * Description:       Minimizable one-on-one chat widget that connects visitors directly to a switchboard-chat backend. No message content is stored on this server.
 * Version:           0.3.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * License:           GPL-2.0-or-later
 * Text Domain:       wp-chat
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WP_CHAT_VERSION', '0.3.0' );
define( 'WP_CHAT_DIR', plugin_dir_path( __FILE__ ) );
define( 'WP_CHAT_URL', plugin_dir_url( __FILE__ ) );

require_once WP_CHAT_DIR . 'includes/settings.php';
require_once WP_CHAT_DIR . 'includes/render.php';

add_action( 'init', function () {
	load_plugin_textdomain( 'wp-chat', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );

add_action( 'admin_init', function () {
	if ( function_exists( 'wp_add_privacy_policy_content' ) ) {
		wp_add_privacy_policy_content(
			'WP Chat',
			wp_kses_post( wpautop( __( 'The chat widget connects your browser directly to our messaging server. This website does not store the content of your conversation. The messaging server sets one cookie holding a random identifier so your conversation can continue; the conversation and the identifier are deleted when you end the chat or after a period of inactivity.', 'wp-chat' ) ) )
		);
	}
} );
