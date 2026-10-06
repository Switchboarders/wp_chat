<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether the chat must appear on the current page: configured, and either shown
 * everywhere or on one of the pages chosen in Settings > WP Chat.
 * Call it from wp hooks that run after the query is parsed (wp_enqueue_scripts, wp_footer).
 */
function wp_chat_should_display() {
	$o = wp_chat_get_options();
	if ( empty( $o['backend_url'] ) ) {
		return false; // Not configured: render nothing.
	}
	if ( 'selected' !== $o['display_mode'] ) {
		return true;
	}
	$ids = array_map( 'intval', (array) $o['page_ids'] );
	// A static page, or the page that was set as "Posts page"
	if ( is_singular( 'page' ) || ( is_home() && ! is_front_page() ) ) {
		return in_array( (int) get_queried_object_id(), $ids, true );
	}
	if ( ! empty( $o['include_posts'] ) ) {
		return is_home() || is_singular( 'post' );
	}
	return false;
}

/**
 * The widget's texts in French and English (languages/widget-strings.json), so the widget can
 * follow the visitor's browser language whatever the site language is.
 */
function wp_chat_widget_strings() {
	$json = json_decode( (string) file_get_contents( WP_CHAT_DIR . 'languages/widget-strings.json' ), true );
	return is_array( $json ) && isset( $json['en'], $json['fr'] ) ? $json : array( 'en' => array(), 'fr' => array() );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( ! wp_chat_should_display() ) {
		return;
	}
	$o = wp_chat_get_options();
	wp_enqueue_style( 'wp-chat', WP_CHAT_URL . 'assets/chat.css', array(), WP_CHAT_VERSION );
	wp_enqueue_script( 'wp-chat', WP_CHAT_URL . 'assets/chat.js', array(), WP_CHAT_VERSION, true );
	$strings = wp_chat_widget_strings();
	// Texts the administrator changed from the defaults are shown as typed in every language
	$custom = array();
	$agent_defaults = array( $strings['en']['agentName'], $strings['fr']['agentName'], __( 'Respondent', 'wp-chat' ) );
	if ( '' !== trim( (string) $o['agent_name'] ) && ! in_array( $o['agent_name'], $agent_defaults, true ) ) {
		$custom['agentName'] = $o['agent_name'];
	}
	$retention_defaults = array( $strings['en']['retention'], $strings['fr']['retention'], wp_chat_defaults()['retention_text'] );
	if ( '' !== trim( (string) $o['retention_text'] ) && ! in_array( $o['retention_text'], $retention_defaults, true ) ) {
		$custom['retention'] = $o['retention_text'];
	}
	wp_localize_script( 'wp-chat', 'WPChatConfig', array(
		'backend'    => $o['backend_url'],
		'color'      => $o['color'],
		'privacyUrl' => $o['privacy_url'],
		'officer'    => $o['privacy_officer'],
		'langMode'   => $o['language_mode'],
		'siteLang'   => ( 0 === strpos( determine_locale(), 'fr' ) ) ? 'fr' : 'en',
		'strings'    => $strings,
		'custom'     => (object) $custom,
	) );
} );

add_action( 'wp_footer', function () {
	if ( wp_chat_should_display() ) {
		echo '<div id="wp-chat-root" aria-live="polite"></div>';
	}
} );
