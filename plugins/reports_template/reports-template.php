<?php
/**
 * Plugin Name:       Reports Template
 * Description:       A Templating tool to fill blocks with calculated values
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Alex Colby
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       reports-template
 *
 * @package           create-block
 */

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function create_block_reports_template_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_reports_template_block_init' );
