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
		'language_mode' => 'auto', // 'auto' (visitor's browser), 'site', 'fr' or 'en'
		'display_mode'  => 'all', // 'all' or 'selected'
		'page_ids'      => array(),
		'include_posts' => 0,
	);
}

function wp_chat_get_options() {
	return wp_parse_args( get_option( 'wp_chat_options', array() ), wp_chat_defaults() );
}

function wp_chat_sanitize( $in ) {
	$d = wp_chat_defaults();
	$page_ids = array();
	foreach ( (array) ( $in['page_ids'] ?? array() ) as $id ) {
		$id = absint( $id );
		if ( $id && 'page' === get_post_type( $id ) ) {
			$page_ids[] = $id;
		}
	}
	// Do not drop a bad URL silently: the chat would just never appear
	$backend = trim( (string) ( $in['backend_url'] ?? '' ) );
	$backend_ok = esc_url_raw( untrailingslashit( $backend ), array( 'https' ) );
	if ( '' !== $backend && '' === $backend_ok && function_exists( 'add_settings_error' ) ) {
		add_settings_error(
			'wp_chat_options',
			'wp_chat_backend_url',
			__( 'The Backend URL must start with https:// (for example https://chat.example.org). It was not saved, so the chat stays hidden.', 'wp-chat' )
		);
	}
	return array(
		'backend_url'     => $backend_ok,
		'agent_name'      => sanitize_text_field( $in['agent_name'] ?? $d['agent_name'] ),
		'color'           => sanitize_hex_color( $in['color'] ?? '' ) ?: $d['color'],
		'privacy_url'     => esc_url_raw( $in['privacy_url'] ?? '' ),
		'privacy_officer' => sanitize_text_field( $in['privacy_officer'] ?? '' ),
		'retention_text'  => sanitize_text_field( $in['retention_text'] ?? $d['retention_text'] ),
		'quick_exit_url'  => esc_url_raw( $in['quick_exit_url'] ?? $d['quick_exit_url'] ),
		'language_mode'   => in_array( $in['language_mode'] ?? '', array( 'auto', 'site', 'fr', 'en' ), true ) ? $in['language_mode'] : 'auto',
		'display_mode'    => ( 'selected' === ( $in['display_mode'] ?? '' ) ) ? 'selected' : 'all',
		'page_ids'        => array_values( array_unique( $page_ids ) ),
		'include_posts'   => empty( $in['include_posts'] ) ? 0 : 1,
	);
}

add_action( 'admin_init', function () {
	register_setting( 'wp_chat', 'wp_chat_options', array( 'sanitize_callback' => 'wp_chat_sanitize' ) );
} );

add_action( 'admin_menu', function () {
	add_options_page( 'WP Chat', 'WP Chat', 'manage_options', 'wp-chat', 'wp_chat_settings_page' );
} );

/**
 * Says in plain words whether the chat is displayed, and why not, with a button that checks
 * the backend from the admin's browser (the same way a visitor's browser will reach it).
 */
function wp_chat_status_notice( $o ) {
	if ( empty( $o['backend_url'] ) ) {
		$class = 'notice-error';
		$text  = __( 'The chat is NOT displayed: the Backend URL is empty. Enter the https:// address of your chat server below and save.', 'wp-chat' );
	} elseif ( 'selected' === $o['display_mode'] && empty( $o['page_ids'] ) && empty( $o['include_posts'] ) ) {
		$class = 'notice-warning';
		$text  = __( 'The chat is NOT displayed: "Only the selected pages" is chosen but no page is ticked.', 'wp-chat' );
	} elseif ( 'selected' === $o['display_mode'] ) {
		$class = 'notice-success';
		/* translators: %d: number of pages */
		$text = sprintf( __( 'The chat is displayed on %d selected page(s).', 'wp-chat' ), count( (array) $o['page_ids'] ) );
	} else {
		$class = 'notice-success';
		$text  = __( 'The chat is displayed on all pages.', 'wp-chat' );
	}
	printf( '<div class="notice %s"><p>%s</p></div>', esc_attr( $class ), esc_html( $text ) );
	if ( empty( $o['backend_url'] ) ) {
		return;
	}
	$msgs = array(
		'testing' => __( 'Testing…', 'wp-chat' ),
		'ok'      => __( 'The chat server answers and accepts this website.', 'wp-chat' ),
		'fail'    => __( 'Cannot reach the chat server from this browser. Check the address (https, no typo), that the server is running, and that this website\'s address is listed in WEB_ALLOWED_ORIGINS on the server.', 'wp-chat' ),
		'other'   => __( 'The chat server answered, but with an unexpected status:', 'wp-chat' ),
	);
	echo '<p><button type="button" class="button" id="wp-chat-test">' . esc_html__( 'Test the chat server', 'wp-chat' ) . '</button> <span id="wp-chat-test-result"></span></p>';
	echo '<script>(function(){var b=document.getElementById("wp-chat-test"),o=document.getElementById("wp-chat-test-result"),m=' . wp_json_encode( $msgs ) . ',u=' . wp_json_encode( $o['backend_url'] ) . ';'
		. 'b.addEventListener("click",function(){o.textContent=m.testing;'
		// /web/stream without a session answers 401 {"error":"no_session"}: proves the server is reachable and CORS lets this site in
		. 'fetch(u+"/web/stream",{credentials:"include"}).then(function(r){o.textContent=(r.status===401)?m.ok:m.other+" "+r.status;}).catch(function(){o.textContent=m.fail;});});})();</script>';
}

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
	echo '<div class="wrap"><h1>WP Chat</h1>';
	settings_errors( 'wp_chat_options' );
	wp_chat_status_notice( $o );
	echo '<form method="post" action="options.php">';
	settings_fields( 'wp_chat' );
	echo '<table class="form-table">';
	foreach ( $fields as $key => $f ) {
		printf(
			'<tr><th><label for="%1$s">%2$s</label></th><td><input class="regular-text" id="%1$s" type="%3$s" name="wp_chat_options[%1$s]" value="%4$s"></td></tr>',
			esc_attr( $key ), esc_html( $f[0] ), esc_attr( $f[1] ), esc_attr( $o[ $key ] )
		);
	}

	// Widget language
	echo '<tr><th><label for="language_mode">' . esc_html__( 'Widget language', 'wp-chat' ) . '</label></th><td>';
	echo '<select id="language_mode" name="wp_chat_options[language_mode]">';
	$modes = array(
		'auto' => __( 'Visitor’s browser language (French or English)', 'wp-chat' ),
		'site' => __( 'Site language', 'wp-chat' ),
		'fr'   => __( 'Always French', 'wp-chat' ),
		'en'   => __( 'Always English', 'wp-chat' ),
	);
	foreach ( $modes as $value => $label ) {
		printf( '<option value="%s" %s>%s</option>', esc_attr( $value ), selected( $o['language_mode'], $value, false ), esc_html( $label ) );
	}
	echo '</select><p class="description">' . esc_html__( 'The respondent name and retention sentence you customize are shown as typed in every language. Leave them at their defaults to have them translated.', 'wp-chat' ) . '</p></td></tr>';

	// Where the chat is displayed
	echo '<tr><th>' . esc_html__( 'Show the chat on', 'wp-chat' ) . '</th><td>';
	printf(
		'<label><input type="radio" name="wp_chat_options[display_mode]" value="all" %s> %s</label><br>',
		checked( $o['display_mode'], 'all', false ),
		esc_html__( 'All pages', 'wp-chat' )
	);
	printf(
		'<label><input type="radio" name="wp_chat_options[display_mode]" value="selected" %s> %s</label>',
		checked( $o['display_mode'], 'selected', false ),
		esc_html__( 'Only the selected pages', 'wp-chat' )
	);
	echo '<fieldset id="wp-chat-pages" style="margin-top:10px">';
	$pages = get_pages( array( 'sort_column' => 'menu_order,post_title', 'post_status' => 'publish' ) );
	if ( $pages ) {
		echo '<div style="max-height:260px;overflow:auto;border:1px solid #c3c4c7;background:#fff;padding:8px 12px;max-width:480px">';
		foreach ( $pages as $page ) {
			printf(
				'<label style="display:block;margin-left:%dpx"><input type="checkbox" name="wp_chat_options[page_ids][]" value="%d" %s> %s</label>',
				count( get_post_ancestors( $page ) ) * 18,
				(int) $page->ID,
				checked( in_array( (int) $page->ID, array_map( 'intval', (array) $o['page_ids'] ), true ), true, false ),
				esc_html( get_the_title( $page ) )
			);
		}
		echo '</div>';
	} else {
		echo '<p>' . esc_html__( 'No published pages yet.', 'wp-chat' ) . '</p>';
	}
	printf(
		'<p><label><input type="checkbox" name="wp_chat_options[include_posts]" value="1" %s> %s</label></p>',
		checked( ! empty( $o['include_posts'] ), true, false ),
		esc_html__( 'Also show on blog posts and the latest-posts home page', 'wp-chat' )
	);
	echo '</fieldset>';
	echo '<p class="description">' . esc_html__( 'The chat is hidden everywhere else, including search results and archives.', 'wp-chat' ) . '</p>';
	echo '</td></tr>';
	echo '</table>';
	submit_button();
	echo '</form>';
	// Grey out the page list while "All pages" is chosen
	echo '<script>(function(){var f=document.getElementById("wp-chat-pages");if(!f){return;}'
		. 'var r=document.querySelectorAll("input[name=\'wp_chat_options[display_mode]\']");'
		. 'function s(){var all=document.querySelector("input[name=\'wp_chat_options[display_mode]\']:checked").value==="all";'
		. 'f.disabled=all;f.style.opacity=all?".5":"1";}'
		. 'r.forEach(function(x){x.addEventListener("change",s);});s();})();</script>';
	echo '</div>';
}
