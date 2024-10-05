System Requirements
===================

Server
------
- Pretty much any operating system that's supported by Rust should work
	- Current version is tested on Linux (currently Arch and the Debian testing)
	- Previous versions have been tested on Windows, current versions should still work
- Apparently doesn't currently run when compiled with MSVC, but works with MinGW.

Client
------
- Should run in any web browser supported by VueJS 3 (any modern web browser)
	- Fully tested in Firefox
	- Partially tested in Chromium, but everything should work


Installation Instructions
=========================

Server
------

1. Ensure you have the required dependencies
	- Requires Rust toolchain (any recent version should work)
		- Visit https://www.rust-lang.org/learn/get-started for installation instructions
2. Run `cargo build --release` in the root of the project
3. The executable can found in `target/release`
	- `garnetdg_streamcontentsystemtest` on Linux
	- `garnetdg_streamcontentsystemtest.exe` on Windows
	- You can copy this executable to any location.
		- For configuration, see the Configuration section

Client
------

1. Ensure you have the required dependencies
	- Requires a recent version of NodeJS and NPM (although other NodeJS package managers should work)
		- Visit https://docs.npmjs.com/downloading-and-installing-node-js-and-npm for installation instructions
2. In the `client` directory, run `npm install`
3. In the `client` directory, run `npm run build`
4. The client files are found in `client/dist`
	- Put these files in the directory specified by the `static_file_root` server config option (see Configuration section)


Configuration
=============

Configuration file is `config.json` in the current working directory of the program.
Currently the server and then clients need to be restarted for changes to take effect. This may be changed in the future.

It contains a JSON object of the following options:

Options
-------
- `host`
	- Host for the server to listen on
	- Default is `"127.0.0.1"`
	- Type: string
	- Change to `"0.0.0.0"` to allow other devices to access
		- NOTE: consider the security implications of allowing other devices to change the content.
		- This should never be enabled on internet-accessible servers
- `port`
	- Port for the server to listen on
	- Default is `4316` (the default port that the program we used to use (OpenLP) listens on)
	- Type: 16-bit unsigned integer
- `cors_allowed_origins`
	- Allowed origins for CORS
	- Default is `[]`
	- Type: array of strings
	- If you aren't using a separate server to serve the client files, leave this unspecified.
	- Intended for debugging only.
- `client_proxy_url`
	- URL to proxy client file requests to
	- Default is `null`
	- Type: string or null
	- If you aren't using a separate server to serve the client files, leave this unspecified.
	- Intended for debugging only.
- `content_directory`
	- Directory that contains the `songs.json` file
	- Default is `./content` (relative to the program's current working directory)
	- Type: string
	- May include more files in the future
	- This can be changed to use a cloud-synced folder (e.g. Onedrive, Google Drive, Nextcloud, etc.)
- `static_file_root`
	- Directory that contains the client files
	- Default is `./client/dist/` (relative to the program's current working directory)
	- Type: string
	- The default allows you to keep everything in the source directories
- `static_file_index`
	- File that gets returned in the static file root when a matching file is not found
	- Default is `index.html`
	- Type: string
	- Used to properly support single-page application
	- Unless you are using a custom client, this should be left the same
- `http_caching_max_age`
	- Maximum amount of seconds to allow browsers to cache the client files
	- Default is `3600` (1 hour)
	- Type: 64-bit unsigned integer
	- Decreasing this may cause more server load
	- Increasing this will cause updates to take a while to propagate to the clients
- `client_options`
	- Object of options passed to the client
	- Default: `{}`
	- Type: JSON object
	- Options:
		- `displays`
			- JSON object of displays and their configurations
			- Default is `{}`
			- Type: JSON object
			- The keys for this object are the display names
			- Options:
				- `render_delay`
					- Delay to add to rendering state updates (in milliseconds)
					- Default is `0`
					- Type: number
				- `fade_speed`
					- Fade transition speed (in milliseconds)
					- Default is `0`
					- Type: number
				- `font_size`
					- Font size of the display
					- Default is `40pt`
					- Type: string or number
					- If type is a number, it is converted to the `pt` CSS unit
					- This may change in the future, so specifying it in the `display_default` object is recommended
				- `background`
					- Background color to display behind the renderer.
					- Default is `transparent`
					- Type: string
					- This is passed to the CSS `background` property
				- `main_content`
					- Whether this is the main content
					- Default is `false`
					- Type: boolean
					- Intended for displays that are the main content (i.e. don't have a stream behind them)
					- Centers text vertically
				- `noninteractable`
					- Changes some settings to avoid accidentally showing stuff
					- Default is `false`
					- Type: boolean
					- Prevents scrollbars, hides cursor, prevents text selection
				- `hide_small_text`
					- Whether to hide the small text item
					- Default is `false`
					- Type: boolean
		- `display_default`
			- Default display configuration when the current display is not found in the `displays` object
			- Default is `{}`
			- Type: JSON object
			- Gets merged with display configuration
			- See `displays` documentation for possible options
		- `ask_service_export_filename`
			- Whether to ask for exported service filename
			- Default is false
			- Type: boolean
			- Useful for if you don't have your browser set up to ask where to save downloads

Source code for server options can be found in `src/config/file.rs`.
Source code for client options can be found in `client/src/stores/config.ts`.
Some options may be purposely undocumented. They should not be used unless instructed by the developer.

Other setup
===========

- Create an empty file in the content directory called `songs.json`
