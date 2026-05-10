<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;
delete_option( 'dc_maint_openai_key' );
delete_option( 'dc_maint_agency_name' );
