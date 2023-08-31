<?php
/**
 * Plugin Name:       Reports Heatmap
 * Description:       A Heatmap of the frequency of PFD reports in the UK.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Alex Colby
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       reports-map
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
function create_block_reports_map_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_reports_map_block_init' );

/**
 * Enqueues necessary scripts to hydrate the block on the frontend.
 */
function create_block_reports_map_frontend_scripts() {
	$asset_file = include( plugin_dir_path( __FILE__ ) . 'build/front.asset.php');
	wp_enqueue_script(
		'create-block-reports-map-frontend-js',
		plugins_url( 'build/front.js', __FILE__ ),
		$asset_file['dependencies'],
		$asset_file['version']
	);
}
add_action( 'wp_enqueue_scripts', 'create_block_reports_map_frontend_scripts' );
