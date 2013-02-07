jquery.TabInterface.js
======================

a jQuery port of our popular TabInterface script

**Version:** 1.5
  
The API
-------

**Configuration**

When instantiating a TabInterface, you have the option of passing in a configuration object to tailor your tabbed interface. This is a list of the options with default values in parentheses:

 * `active_class` ('enabled') - The `class` used to toggle styles on (activates the interface)
 * `tabpanel_el` ('section') - The container for each content block
 * `tabpanel_class` ('TabInterface-tabpanel') - The `class` to apply to each tab panel
 * `tabpanel_hidden_class` ('TabInterface-abpanel-hidden') - The `class` to give a tab panel when it is hidden
 * `tablist_el` ('ol') - The element type used for wrapping the tab list
 * `tablist_class` ('TabInterface-tablist') - `class` to apply to the tab list
 * `tablist_position` ('before') - Source order placement (before or after) for the tab list
 * `tab_el` ('li') - The element type used for each tab
 * `tab_class` ('TabInterface-tab') - `class` to apply to each tab
 * `tab_active_class` ('TabInterface-active') - The `class` to use for the active tab
 * `tab_thumbnail_class` ('TabInterface-tab-thumbnail') - The `class` to apply to thumbnail previews in tabs
 * `hide_headers` (true) - Hide the headers?
 * `heading_hidden_class` ('TabInterface-heading-hidden') - The `class` to apply to hidden headings

Example:
		
	$('.tabbed-interface').TabInterface({
		tablist_position: 'after',
		hide_headers: false
	});

**Callbacks**

Calbacks allow you to manipulate the TabInterface at various points in the build process. You can assign handlers for these callback in your configuration object. Note: `this` in all callbacks refers to the TabInterface container jQuery object

 * `oninit` - called when the TabInterface spins up
 * `oncomplete` - called after the TabInterface is built
 * `onbeforechange` - called before a new tab panel is focused
 * `onafterchange` - called after a new tab panel is focused

Example:
		
	$('.tabbed-interface').TabInterface({
		oninit: function(){ alert('hi'); },
		oncomplete: function(){ alert('bye'); }
	});

**Markup-based Controls (via HTML `data-*` attributes)**

 * `data-tab-hide-headers` (boolean) - Attribute on container to control whether headings should be hidden when tabs are created
 * `data-tab-title` (string) - Attribute on headings used to provide alternate titles
 * `data-tab-thumbnail` (URI) - Attribute on headings used to provide a thumbnail image
 * `data-tab-focus` (void) - Attribute on headings used to auto-focus a tab other than the first one

Example:

	<div class="tabbed-interface" data-tab-hide-headers="false">
		<h2 data-tab-title="Short Title">A really long long long long title</h2>
		…
		<h2 data-tab-focus>This content will be focused on load</h2>
		…
	</div>

**Hash Watching**

This script watches for hashchange events and will focus a tab heading 
within it is targeted.