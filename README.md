# JPDB Snippet Generator

A Chrome extension for Jetpack support engineers. Paste a site URL, get the Jetpack connection status, and copy a formatted snippet ready to paste into internal support notes.
Useful when troubleshooting and working on tickets. 

**Output:** `Site: https://example.com | JPDB 🟢 |`

JPDB links directly to the Jetpack Debugger for that site.

## Install

1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the folder

## Usage

1. Open Jetpack Debugger 
2. Click the extension icon
3. Paste the site URL and press Enter
4. Click Copy
5. Paste into your internal note

## Notes

Requires proxy access to reach `jptools.wordpress.com`.
