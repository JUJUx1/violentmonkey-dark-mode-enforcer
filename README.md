# Dark Mode Enforcer — Userscript

Install this userscript in Violentmonkey (or a compatible userscript manager) to force a dark theme on websites.

Installation

1. Open Violentmonkey and create a new script.
2. Copy the contents of `userscripts/dark-mode-enforcer.user.js` into the new script and save.
3. Toggle the floating button at the bottom-right to open the settings panel.

Features

- Global enable/disable.
- Per-site enable/disable (saved across reloads).
- Simple, robust invert-based dark transform.

Notes

- The script uses an invert+hue-rotate technique which works well on many sites but may not be perfect everywhere.
- Images, videos and iframes are inverted back to keep their colors correct.
- For sites with sensitive content, disable the script on those hosts.

Development

- File: `userscripts/dark-mode-enforcer.user.js`

License

MIT
