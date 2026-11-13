<?php
/**
 * Linking this website to a committee with the string shown by SwitchBoard ("Link a website"):
 *   https://chat.example.org#K7QM-3XRA-PW2D
 * The plugin sends the one-time code and this website's address to the chat server (POST /web/pair, from
 * this server, not the visitor's browser). From then on the chat server accepts this website and sends its
 * chats to that committee, and the Backend URL is filled in here. Nothing to configure on the server.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Splits the pasted string into the chat server's address and the code. Returns array( url, code ) or null.
 */
function wp_chat_parse_link( $text ) {
	$text = trim( (string) $text );
	$hash = strrpos( $text, '#' );
	if ( false === $hash ) {
		return null;
	}
	$url  = esc_url_raw( untrailingslashit( substr( $text, 0, $hash ) ), array( 'https' ) );
	$code = strtoupper( preg_replace( '/[^A-Za-z0-9]/', '', substr( $text, $hash + 1 ) ) );
	if ( '' === $url || 12 !== strlen( $code ) ) {
		return null;
	}
	return array( $url, substr( $code, 0, 4 ) . '-' . substr( $code, 4, 4 ) . '-' . substr( $code, 8, 4 ) );
}

/** This website's origin as visitors' browsers send it (scheme://host[:port]). */
function wp_chat_site_origin() {
	$parts = wp_parse_url( home_url() );
	$origin = ( $parts['scheme'] ?? 'https' ) . '://' . strtolower( $parts['host'] ?? '' );
	if ( ! empty( $parts['port'] ) ) {
		$origin .= ':' . (int) $parts['port'];
	}
	return $origin;
}

/** The chat server's answer, in words for the administrator. */
function wp_chat_link_error_message( $code ) {
	switch ( $code ) {
		case 'invalid_code':
			return __( 'The code was refused: it may have expired (30 minutes), already been used, or been mistyped. Ask SwitchBoard for a new one.', 'wp-chat' );
		case 'bad_origin':
			return __( 'The chat server refused this website\'s address: it must start with https:// (Settings > General).', 'wp-chat' );
		case 'too_many_attempts':
			return __( 'Too many attempts from this server: wait an hour and try again.', 'wp-chat' );
		default:
			return __( 'The chat server could not link this website. Try again later, or ask for a new code.', 'wp-chat' );
	}
}

/**
 * Links this website with the pasted string. Returns array( true|false, message for the administrator ).
 * Also used by tests (wp eval).
 */
function wp_chat_link_with( $text ) {
	$parsed = wp_chat_parse_link( $text );
	if ( null === $parsed ) {
		return array( false, __( 'Paste the whole string shown by SwitchBoard: the chat server\'s https:// address, then # and the code (for example https://chat.example.org#K7QM-3XRA-PW2D).', 'wp-chat' ) );
	}
	list( $url, $code ) = $parsed;
	$response = wp_remote_post(
		$url . '/web/pair',
		array(
			'timeout' => 20,
			'headers' => array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode( array( 'code' => $code, 'origin' => wp_chat_site_origin() ) ),
		)
	);
	if ( is_wp_error( $response ) ) {
		/* translators: %s: technical error */
		return array( false, sprintf( __( 'Cannot reach the chat server from this website\'s server (%s). Check the address in the string.', 'wp-chat' ), $response->get_error_message() ) );
	}
	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( 200 !== wp_remote_retrieve_response_code( $response ) || empty( $body['ok'] ) ) {
		return array( false, wp_chat_link_error_message( $body['error'] ?? '' ) );
	}
	$o = get_option( 'wp_chat_options', array() );
	$o = is_array( $o ) ? $o : array();
	$o['backend_url'] = $url;
	$o['linked_at']   = time();
	$o['linked_to']   = $url;
	update_option( 'wp_chat_options', $o );
	/* translators: %s: chat server address */
	return array( true, sprintf( __( 'This website is now linked to its committee on %s. The chat is ready: try it in a private window.', 'wp-chat' ), $url ) );
}

add_action( 'admin_post_wp_chat_link', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'wp-chat' ), 403 );
	}
	check_admin_referer( 'wp_chat_link' );
	list( $ok, $msg ) = wp_chat_link_with( wp_unslash( $_POST['wp_chat_link'] ?? '' ) );
	set_transient( 'wp_chat_link_result', array( $ok ? 'success' : 'error', $msg ), 60 );
	wp_safe_redirect( admin_url( 'options-general.php?page=wp-chat' ) );
	exit;
} );

/** The "Link this website" box at the top of the settings page. */
function wp_chat_link_box( $o ) {
	$result = get_transient( 'wp_chat_link_result' );
	if ( $result ) {
		delete_transient( 'wp_chat_link_result' );
		printf( '<div class="notice notice-%s"><p>%s</p></div>', 'success' === $result[0] ? 'success' : 'error', esc_html( $result[1] ) );
	}
	echo '<div class="card" style="max-width:none;"><h2>' . esc_html__( 'Link this website to a committee', 'wp-chat' ) . '</h2>';
	if ( ! empty( $o['linked_at'] ) && ! empty( $o['linked_to'] ) && $o['linked_to'] === $o['backend_url'] ) {
		/* translators: 1: chat server address, 2: date */
		echo '<p>' . esc_html( sprintf( __( 'Linked to %1$s on %2$s.', 'wp-chat' ), $o['linked_to'], wp_date( get_option( 'date_format' ), (int) $o['linked_at'] ) ) ) . '</p>';
	}
	echo '<p>' . esc_html__( 'In SwitchBoard, the committee\'s "SwitchBoard Chat" page has a "Link a website" button: it shows a string valid for 30 minutes. Paste it here.', 'wp-chat' ) . '</p>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'wp_chat_link' );
	echo '<input type="hidden" name="action" value="wp_chat_link">';
	echo '<p><input class="large-text code" type="text" name="wp_chat_link" placeholder="https://chat.example.org#K7QM-3XRA-PW2D" autocomplete="off" spellcheck="false"></p>';
	submit_button( __( 'Link', 'wp-chat' ), 'primary', 'submit', false );
	echo '</form></div>';
}
