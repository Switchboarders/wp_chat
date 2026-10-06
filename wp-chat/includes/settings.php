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
	return array(
		'backend_url'     => esc_url_raw( untrailingslashit( $in['backend_url'] ?? '' ), array( 'https' ) ),
		'agent_name'      => sanitize_text_field( $in['agent_name'] ?? $d['agent_name'] ),
		'color'           => sanitize_hex_color( $in['color'] ?? '' ) ?: $d['color'],
		'privacy_url'     => esc_url_raw( $in['privacy_url'] ?? '' ),
		'privacy_officer' => sanitize_text_field( $in['privacy_officer'] ?? '' ),
		'retention_text'  => sanitize_text_field( $in['retention_text'] ?? $d['retention_text'] ),
		'quick_exit_url'  => esc_url_raw( $in['quick_exit_url'] ?? $d['quick_exit_url'] ),
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
