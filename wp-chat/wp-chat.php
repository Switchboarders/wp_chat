<?php
/**
 * Plugin Name:       WP Chat
 * Description:       Minimizable one-on-one chat widget that connects visitors directly to a switchboard-chat backend. No message content is stored on this server.
 * Version:           0.8.1
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Plugin URI:        https://github.com/Switchboarders/wp_chat
 * Author:            Switchboarders
 * Author URI:        https://github.com/Switchboarders
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain:       wp-chat
 * Domain Path:       /languages
 *
 * Copyright (C) 2026 Switchboarders (https://github.com/Switchboarders/wp_chat)
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version. This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU General Public License (LICENSE file) for more details.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WP_CHAT_VERSION', '0.8.1' );
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
			wp_kses_post( wpautop( __( 'The chat widget connects your browser directly to our messaging server. This website does not store the content of your conversation. The messaging server gives your browser a temporary random identifier, kept in your browser (no cookie is used) so your conversation continues if you reload the page or open another page of this website; the conversation and the identifier are deleted when you end the chat, or after 48 hours without activity. If a volunteer blocks a visitor for abuse, a small “blocked until” marker (no personal information) is kept in that visitor\'s browser until the block ends.', 'wp-chat' ) ) )
		);
	}
} );
