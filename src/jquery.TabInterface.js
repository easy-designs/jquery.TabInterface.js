/*! (c) Aaron Gustafson (@AaronGustafson). MIT License. http://github.com/easy-designs/jquery.TabInterface.js v1.5 */

/*------------------------------------------------------------------------------
 * Version 1.5
 *------------------------------------------------------------------------------
 *  
 * API
 * 
 * When instantiating a TabInterface, you have the option of passing in a
 * configuration object to tailor your tabbed interface. This is a list of the 
 * options with default values in parentheses:
 * 
 * str	active_class ('enabled')
 * 		The class used to toggle styles on (activates the interface)
 * str	tabpanel_el ('section')
 * 		The container for each content block
 * str	tabpanel_class ('TabInterface-tabpanel')
 * 		The class to apply to each tab panel
 * str	tabpanel_hidden_class ('TabInterface-abpanel-hidden')
 * 		The class to give a tab panel when it is hidden
 * str	tablist_el ('ol')
 * 		The element type used for wrapping the tab list
 * str	tablist_class ('TabInterface-tablist')
 * 		Class to apply to the tab list
 * str	tablist_position ('before')
 * 		Source order placement (before or after) for the tab list
 * str	tab_el ('li')
 * 		The element type used for each tab
 * str	tab_class ('TabInterface-tab')
 * 		Class to apply to each tab
 * str	tab_active_class ('TabInterface-active')
 * 		The class to use for the active tab
 * str	tab_thumbnail_class ('TabInterface-tab-thumbnail')
 * 		The class to apply to thumbnail previews in tabs
 * bool	hide_headers (true)
 * 		Hide the headers?
 * str	heading_hidden_class ('TabInterface-heading-hidden')
 * 		The class to apply to hidden headings
 * 
 * Example:
 * 		
 * 		$('.tabbed-interface').TabInterface({
 * 			tablist_position: 'after',
 * 			hide_headers: false
 * 		})
 * 
 * 
 * Callbacks allow you to manipulate the TabInterface at various points in 
 * the build process. You can assign handlers for these callback in your 
 * configuration object. Note: `this` in all callbacks refers to the 
 * TabInterface container jQuery object
 * 
 * oninit			called when the TabInterface spins up
 * oncomplete		called after the TabInterface is built
 * onbeforechange	called before a new tab panel is focused
 * onafterchange	called after a new tab panel is focused
 * 
 * Example:
 * 		
 * 		$('.tabbed-interface').TabInterface({
 * 			oninit: function(){ alert('hi'); },
 * 			oncomplete: function(){ alert('bye'); }
 * 		})
 * 
 * 
 * Markup Controls:
 * 
 * bool	data-tab-hide-headers
 * 		Attribute on container to control whether headings should be hidden
 * 		when tabs are created
 * str	data-tab-title
 * 		Attribute on headings used to provide alternate titles
 * url	data-tab-thumbnail
 * 		Attribute on headings used to provide a thumbnail image
 * null	data-tab-focus
 * 		Attribute on headings used to auto-focus a tab other than the first one
 * 
 * Example: 
 * 
 * 		<div class="tabbed-interface" data-tab-hide-headers="false">
 * 			<h2 data-tab-title="Short Title">A really long long long long title</h2>
 * 			…
 * 			<h2 data-tab-focus>This content will be focused on load</h2>
 * 			…
 * 		</div>
 * 
 * Hash Watching
 * This script watches for hashchange events and will focus a tab heading 
 * within it is targeted.
 * 
 * ---------------------------------------------------------------------------*/

;(function( $, window, UNDEFINED ){
	
	var uuid = ( new Date() ).getTime(),
		TRUE = true,
		FALSE = false,
		NULL = null,
		DESTROY = 'destroy',
		TABINTERFACE = 'TabInterface',
		ENABLED = TABINTERFACE + '-enabled',
		ARIA_ACTIVEDESCENDANT = 'aria-activedescendant',
		ARIA_CONTROLS = 'aria-controls',
		HIDDEN = 'hidden',
		NEXT = 'next',
		PREV = 'prev',
		tap_evt = 'click',
		tab_selector = '[role=tab]',
		$window = $(window),
		location = window.location,
		size = 0,
		defaults = {
			threshold: 0, // always enabled
			active_class: ENABLED,
			tabpanel_el: 'section',
			tabpanel_class: TABINTERFACE + '-tabpanel',
			tabpanel_hidden_class: TABINTERFACE + '-tabpanel-' + HIDDEN,
			tablist_el: 'ol',
			tablist_class: TABINTERFACE + '-tablist',
			tablist_position: 'before', // or 'after'
			tab_el: 'li',
			tab_class: TABINTERFACE + '-tab',
			tab_active_class: TABINTERFACE + '-active',
			tab_thumbnail_class: TABINTERFACE + 'tab-thumbnail',
			hide_headers: TRUE,
			heading_hidden_class: TABINTERFACE + '-heading-' + HIDDEN,
			// callbacks
			oninit: function(){},
			oncomplete: function(){},
			onbeforechange: function(){},
			onafterchange: function(){}
		};
		
	// update tap event
	if ( 'ontouchstart' in window ||
		 'createTouch' in document )
	{
		tap_evt = 'touchend';
	}
	
	// resize watcher
	window.watchResize = function(callback)
	{
		var resizing;
		function done()
		{
			clearTimeout( resizing );
			resizing = NULL;
			callback();
		}
		$window.resize(function(){
			if ( resizing )
			{
				clearTimeout( resizing );
				resizing = NULL;
			}
			resizing = setTimeout( done, 50 );
		});
		// init
		callback();
	};
	window.watchResize(function(){
		size = $window.width();
	});
	
	// Private TabInterface Object
	function TabInterface( opt, $prototypes )
	{
		var	$self,
			$tablist = $prototypes['tablist'].clone(),
			curr_tab = NULL;

		function create()
		{
			// Callback: oninit
			opt.oninit.call( this );

			$self = $( this );

			var	$first = $self.children().eq(0),
				// unique id (if needed)
				id = $self.attr('id') || TABINTERFACE + '-' + uuid++,
				tag = FALSE,
				rexp,
				arr,
				i, len,
				$tabpanel, tp_id,
				$tab, t_id,
				hide_headings = opt.hide_headers,
				$heading, title, thumbnail,
				$headings, $overload_focus;

			// Prevent re-init
			if ( $self.data( ENABLED ) )
			{
				return;
			}

			// overload configured header hiding
			if ( $self.is('[data-tab-hide-headers]') )
			{
				hide_headings = !( $self.data('tab-hide-headers') == 'false' );
			}

			if ( $first.is( 'h1, h2, h3, h4, h5, h6' ) )
			{

				tag = $first.get(0).nodeName.toLowerCase();

				$self
					.data( ENABLED, TRUE )
					.addClass( opt.active_class )
					.attr({
						'id': id,
						'role': 'application'
					 });


				// chunk the content
				rexp = new RegExp( '<(' + tag + ')', 'ig' );
				arr	 = $self.html().replace( rexp, "||||<$1" ).split( '||||' );
				arr.shift();

				// empty the container
				$self.html('');

				// re-insert the chunks
				for ( i=0, len=arr.length; i<len; i++ )
				{
					// establish the ids
					tp_id	= id + '-' + i + '-tabpanel';
					t_id	= id + '-' + i + '-tab';

					// build the tab panel
					$tabpanel = $prototypes['tabpanel'].clone()
									.attr({
										'id': tp_id,
										'aria-labelledby': t_id
									})
									.html( arr[i] )
									.appendTo( $self );

					// build the tab
					$tab = $prototypes['tab'].clone()
								.attr({
									'id': t_id,
									'aria-controls': tp_id,
									'aria-describedby': tp_id
								 })
								.appendTo( $tablist );

					// work out the heading
					$heading = $tabpanel.find( tag ).eq(0);
					title = $heading.data( 'tab-title' );
					thumbnail = $heading.data( 'tab-thumbnail' );
					if ( thumbnail )
					{
						title += ' <img class="' + opt.tab_thumbnail_class +  '" src="' + thumbnail + '" alt=""/>';
					}
					$tab.html( title || $heading.html() );
					if ( hide_headings && ! title )
					{
						$heading
							.attr( HIDDEN, HIDDEN )
							.addClass( opt.heading_hidden_class );
					}

					// active?
					if ( i === 0 )
					{
						$self.attr( ARIA_ACTIVEDESCENDANT, tp_id );

						$tabpanel
							.attr( 'aria-hidden', 'false' )
							.removeClass( opt.tabpanel_hidden_class )
							.removeAttr( HIDDEN );

						$tab.attr({
								'aria-selected': 'true',
								'tabindex': '0'
							 })
							.addClass( opt.tab_active_class );
					}
				}

				// delegate
				$tablist
					.on( tap_evt + ' focus', tab_selector, swap )
					.on( 'keydown', tab_selector, moveFocus );

				// add the tablist
				$self[ ( opt.tablist_position == 'before' ? 'prepend' : 'append' ) ]( $tablist );

				// any headings overloading the active one?
				$headings = $self.find( tag );
				$overload_focus = $headings.filter( '[data-tab-focus]' );
				if ( $overload_focus.length > 0 )
				{
					$tablist.find( tab_selector ).eq( $headings.index( $overload_focus ) )
						.trigger( tap_evt );
				}

				// manage hashchange
				$window
					.on( 'hashchange load', hashChange );

				// Callback: oncomplete
				opt.oncomplete.call( this );

			}

			function hashChange()
			{
				var id_reference = location.hash,
					$target = $headings.filter( id_reference );

				if ( $target.length > 0 )
				{
					$tablist.find( tab_selector ).eq( $headings.index( $target ) )
						.trigger( tap_evt );
					$window.scrollTop( $tablist.offset().top );
				}
			}

			function swap( e )
			{
				var	active_class = opt.tab_active_class,
					hidden_class = opt.tabpanel_hidden_class,
					$new_tab = $( e.target ).closest('[role=tab]'),
					new_tab = $new_tab.get(0),
					old_tabpanel_id = $self.attr(ARIA_ACTIVEDESCENDANT),
					new_tabpanel_id = $new_tab.attr(ARIA_CONTROLS);

				// focus & tap event could be triggered at the same time,
				// we need to track the current tab
				if ( curr_tab &&
					 curr_tab == new_tab  )
				{
					return;
				}
				curr_tab = new_tab;

				// Callback: onbeforechange
				opt.onbeforechange.call( this );

				// deactivate the old tab & tabpanel
				$tablist.find( '[aria-selected=true]' )
					.removeClass( active_class )
					.attr({
						'aria-selected': 'false',
						'tabindex': '-1'
					 });
				$( '#' + old_tabpanel_id, $self )
					.addClass( hidden_class )
					.attr({
						'aria-hidden': 'true',
						'hidden': 'hidden'
					 });

				// activate the new tab & tabpanel
				$new_tab
					.addClass( active_class )
					.attr({
						'aria-selected': 'true',
						'tabindex': '0'
					 });
				$( '#' + new_tabpanel_id, $self )
					.removeClass( hidden_class )
					.attr('aria-hidden', 'false')
					.removeAttr('hidden');

				$self.attr( ARIA_ACTIVEDESCENDANT, new_tabpanel_id );

				// Callback: onafterchange
				opt.onafterchange.call( this );
			}

			function moveFocus( e )
			{
				switch ( e.which )
				{
					case 13: // enter
						$( '#' + $( e.target ).attr(ARIA_CONTROLS) ).focus();
						break;	  
					case 37: // left arrow
					case 38: // up arrow
						move( PREV, false );
						break;
					case 39: // right arrow
					case 40: // down arrow
						move( NEXT, false );
						break;
					case 36: // home
						move( PREV, true );
						break;	  
					case 35: // end
						move( NEXT, true );
						break;	  
					case 27: // escape
						$( e.target ).blur();
						break;
				}
			}

		};
		
		function move( direction, complete )
		{
			var complete = complete || FALSE,
				$tab = $tablist.find( '[aria-selected=true]' ),
				$first = $tablist.find( '[role=tab]:first-child' ),
				$last = $tablist.find( '[role=tab]:last-child' ),
				$target;

			if ( complete )
			{
				( direction == PREV ? $first : $last ).focus();
			}
			else
			{
				$target = $tab[ direction == PREV ? PREV : NEXT ]();
				if ( $target.length )
				{
					$target.focus();
				}
				// wrap
				else
				{
					( direction == NEXT ? $first : $last ).focus();
				}
			}
		};
		
		function destroy()
		{
			
			$self = $(this)
						.removeClass( ENABLED )
						.removeAttr( ARIA_ACTIVEDESCENDANT )
						.removeAttr( 'role' );
			
			// remove the tablist
			$self
				.find('[role=tablist]')
				.remove();
			
			// remove the tab panels
			$self.find('[role=tabpanel] > *').unwrap();

			// unhide any hidden headings
			$self.find( '.' + opt.heading_hidden_class )
				.removeAttr( HIDDEN )
				.removeClass( opt.heading_hidden_class );

		};
		

		// public methods
		this.create = create;
		this.move = move;
		this.destroy = destroy;

	}
	
	// Public Access
	$.fn.TabInterface = function( config )
	{

		// continue
		var $this = $( this ),
		
			// options
			opt = $.extend(defaults, config),
			
			// prototype elements
			$prototypes = {
				'tabpanel':	$( '<' + opt.tabpanel_el + ' class="' + opt.tabpanel_class + ' ' + opt.tabpanel_hidden_class + '"/>' )
								.attr({
									'aria-hidden': 'true',
									'hidden': 'hidden',
									'role': 'tabpanel',
									'tabindex': '-1'
								}),
				'tab': 		$( '<' + opt.tab_el + ' class="' + opt.tab_class + '"/>' )
								.attr({
									'role': 'tab',
									'aria-selected': 'false',
									'tabindex': '-1'
								}),
				'tablist':	$( '<' + opt.tablist_el + ' class="' + opt.tablist_class + '"/>' )
								.attr( 'role', 'tablist' )
			};
		
		return $this.each(function(){
			
			var tabbed_interface = this,
				$tabbed_interface = $(tabbed_interface),
				threshold = $tabbed_interface.is('[data-tab-threshold]') ? $tabbed_interface.data('tab-threshold') : opt.threshold,
				TI = new TabInterface( opt, $prototypes );
			
			if ( threshold > 0 )
			{
				
				// watch resizing to see if we need to create
				window.watchResize(function(){
					
					if ( size >= threshold &&
						 ! $tabbed_interface.is( '.' + ENABLED ) )
					{
						TI.create.call( tabbed_interface );
					}
					else if ( size < threshold &&
							  $tabbed_interface.is( '.' + ENABLED ) )
					{
						TI.destroy.call( tabbed_interface );
					}

				});

			}
			else
			{
				TI.create.call( tabbed_interface );
			}
			
		});
		
	};
	
}( jQuery, window ));