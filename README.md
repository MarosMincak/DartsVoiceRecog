# DartsVoice

Voice-controlled scoring for N01 darts matches.  
This Chromium extension listens to spoken scores, writes them into the current Nakka scoreboard, and submits the throw hands-free. It is designed for Slovak-speaking players, but supports dozens of recognition dialects.

## Features

- 🎤 Hands-free input &mdash; Web Speech API captures your score and simulates the submit key press.
- 🔁 Automatic recovery &mdash; recognition session restarts after each throw so you can keep playing.
- 🌐 Multi-language support &mdash; choose detection language and dialect directly from the popup.
- ⚠️ Smart feedback &mdash; popup shows status, errors, and unsupported tab warnings in real time.
- 🧠 Persistent session state &mdash; background worker keeps track of tab language and running status.
- ✨ Modern popup UI &mdash; refreshed design with accessible controls and dark theme.

## Getting Started

1. Run `npm install` (only needed if you plan to add dependencies; none are required by default).
2. Open Chromium-based browser → `chrome://extensions`.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** and select the repository directory.
5. Navigate to `https://n01darts.com/n01/web/` and start or load a match.

## Using Voice Darts

1. Open the extension popup.
2. Confirm that “Nakka” is the active application.
3. Pick your preferred language and dialect.
4. Press **Start listening**. When the toggle glows, start announcing darts totals (e.g. “one hundred twenty”).
5. The score is parsed, clamped to 0–180, written to the scoreboard field, and Enter is fired.
6. Stop listening at any time, or change the dialect to restart recognition with a new language.

### Tips

- The extension only activates on N01 matches; other tabs show an unsupported warning.
- Grant microphone permissions when prompted; denial prevents the auto-restart loop.
- If recognition stalls, click **Stop listening** and start again to refresh the session.

## Architecture Overview

| Module          | Role                                                                 |
|-----------------|----------------------------------------------------------------------|
| `background.js` | Keeps per-tab session state (status, language, last error).          |
| `content.js`    | Manages the `SpeechRecognition` lifecycle and submits scores.        |
| `popup.js`      | Renders controls, syncs with background, and owns UX interactions.   |
| `lang.js`       | Minimal localization helper used across popup strings.               |
| `popup.*`       | Updated HTML/CSS for the new design and accessible controls.         |

Speech recognition is restarted after each `end` event unless a fatal error such as microphone denial is reported. Messages are exchanged via a `scope: "dartsvoice"` namespace to keep the background worker clean.

## Developing

- Modify files as needed, then reload the extension from `chrome://extensions`.
- Use the browser console on the N01 page to spot recognition logs (toggle `DEBUG` flag in `content.js`).
- Keep DOM selectors in sync with the scoreboard markup; the current target is `.input_area`.
- When adding new strings, append them to `lang.js` to preserve localization lookup.

## Roadmap Ideas

1. Add pre-defined phrases for X01 scoring shortcuts (e.g. “bust”, “double top”).
2. Support additional darts platforms beyond Nakka.
3. Persist language preferences across reloads with `chrome.storage.sync`.
4. Provide an onboarding overlay explaining microphone permissions to first-time users.

---

Created for dart players who prefer keeping their hands on the oche rather than the keyboard. Good luck and good darts! 🎯
