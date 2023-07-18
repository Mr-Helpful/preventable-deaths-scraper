=== Reports Map ===
Contributors:      Alex Colby
Tags:              block
Tested up to:      6.1
Stable tag:        1.0.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

A Heatmap over Coroner areas in the UK

== Description ==

Provides a block that generates a Heatmap of the number of coroner reports in each coroner area within the UK, based on a `.csv` file of report counts, following the format of:

| coroner_area | count |
| :----------- | :---- |
| Avon         | 79    |
| Berkshire    | 45    |
| Ceredigion   | 1     |
| Cheshire     | 27    |
| ...          | ...   |

TODO:
- allow external url sources
- add counts over time ranges

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/reports-map` directory, or install the plugin through the WordPress plugins screen directly.
1. Activate the plugin through the 'Plugins' screen in WordPress

== Changelog ==

= 1.0.0 =

Initial version:
- adds heatmap
