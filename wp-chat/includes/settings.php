<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function wp_chat_defaults() {
	return array(
		'backend_url'   => '',
		'agent_name'    => __( 'Respondent', 'wp-chat' ),
		'color'         => '#2b6cb0',
		'privacy_url'   => '',
		'privacy_officer' => '',
		'retention_text' => __( 'Your conversation is deleted when you end the chat or after 24 hours of inactivity.', 'wp-chat' ),
		'quick_exit_url' => 'https://www.google.com',
	);
}

function wp_chat_get_options() {
	return wp_parse_args( get_option( 'wp_chat_options', array() ), wp_chat_defaults() );
}

function wp_chat_sanitize( $in ) {
	$d = wp_chat_defaults();
	return array(
		'backend_url'     => esc_url_raw( untrailingslashit( $in['backend_url'] ?? '' ), array( 'https' ) ),
		'agent_name'      => sanitize_text_field( $in['agent_name'] ?? $d['agent_name'] ),
		'color'           => sanitize_hex_color( $in['color'] ?? '' ) ?: $d['color'],
		'privacy_url'     => esc_url_raw( $in['privacy_url'] ?? '' ),
		'privacy_officer' => sanitize_text_field( $in['privacy_officer'] ?? '' ),
		'retention_text'  => sanitize_text_field( $in['retention_text'] ?? $d['retention_text'] ),
		'quick_exit_url'  => esc_url_raw( $in['quick_exit_url'] ?? $d['quick_exit_url'] ),
	);
}

add_action( 'admin_init', function () {
	register_setting( 'wp_chat', 'wp_chat_options', array( 'sanitize_callback' => 'wp_chat_sanitize' ) );
} );

add_action( 'admin_menu', function () {
	add_options_page( 'WP Chat', 'WP Chat', 'manage_options', 'wp-chat', 'wp_chat_settings_page' );
} );

function wp_chat_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$o = wp_chat_get_options();
	$fields = array(
		'backend_url'     => array( __( 'Backend URL (https)', 'wp-chat' ), 'url' ),
		'agent_name'      => array( __( 'Name shown for the respondent', 'wp-chat' ), 'text' ),
		'color'           => array( __( 'Accent color', 'wp-chat' ), 'text' ),
		'privacy_url'     => array( __( 'Privacy policy URL', 'wp-chat' ), 'url' ),
		'privacy_officer' => array( __( 'Person responsible for privacy (Law 25)', 'wp-chat' ), 'text' ),
		'retention_text'  => array( __( 'Retention sentence shown before chatting', 'wp-chat' ), 'text' ),
		'quick_exit_url'  => array( __( 'Quick exit URL', 'wp-chat' ), 'url' ),
	);
	echo '<div class="wrap"><h1>WP Chat</h1><form method="post" action="options.php">';
	settings_fields( 'wp_chat' );
	echo '<table class="form-table">';
	foreach ( $fields as $key => $f ) {
		printf(
			'<tr><th><label for="%1$s">%2$s</label></th><td><input class="regular-text" id="%1$s" type="%3$s" name="wp_chat_options[%1$s]" value="%4$s"></td></tr>',
			esc_attr( $key ), esc_html( $f[0] ), esc_attr( $f[1] ), esc_attr( $o[ $key ] )
		);
	}
	echo '</table>';
	submit_button();
	echo '</form></div>';
}
