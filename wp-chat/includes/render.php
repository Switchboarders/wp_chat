<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', function () {
	$o = wp_chat_get_options();
	if ( empty( $o['backend_url'] ) ) {
		return; // Not configured: render nothing.
	}
	wp_enqueue_style( 'wp-chat', WP_CHAT_URL . 'assets/chat.css', array(), WP_CHAT_VERSION );
	wp_enqueue_script( 'wp-chat', WP_CHAT_URL . 'assets/chat.js', array(), WP_CHAT_VERSION, true );
	wp_localize_script( 'wp-chat', 'WPChatConfig', array(
		'backend'     => $o['backend_url'],
		'agentName'   => $o['agent_name'],
		'color'       => $o['color'],
		'privacyUrl'  => $o['privacy_url'],
		'officer'     => $o['privacy_officer'],
		'retention'   => $o['retention_text'],
		'quickExit'   => $o['quick_exit_url'],
		'i18n'        => array(
			'open'      => __( 'Open chat', 'wp-chat' ),
			'minimize'  => __( 'Minimize chat', 'wp-chat' ),
			'title'     => __( 'Talk to someone', 'wp-chat' ),
			'consent'   => __( 'This chat is confidential. We do not keep your messages on this website.', 'wp-chat' ),
			'officer'   => __( 'Privacy contact:', 'wp-chat' ),
			'policy'    => __( 'Privacy policy', 'wp-chat' ),
			'start'     => __( 'I understand, start chatting', 'wp-chat' ),
			'placeholder' => __( 'Type your message…', 'wp-chat' ),
			'send'      => __( 'Send', 'wp-chat' ),
			'end'       => __( 'End chat', 'wp-chat' ),
			'exit'      => __( 'Quick exit', 'wp-chat' ),
			'ended'     => __( 'The chat has ended and your conversation was deleted.', 'wp-chat' ),
			'error'     => __( 'Connection problem. Please try again.', 'wp-chat' ),
			'typing'    => __( 'is typing…', 'wp-chat' ),
		),
	) );
} );

add_action( 'wp_footer', function () {
	$o = wp_chat_get_options();
	if ( ! empty( $o['backend_url'] ) ) {
		echo '<div id="wp-chat-root" aria-live="polite"></div>';
	}
} );
