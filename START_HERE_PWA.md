# Wear to Madrasa — installable, offline-capable PWA

This is an upgrade for your existing `learn_arabic` Next.js App Router + TypeScript
project. It is **not** a second project and does not contain node_modules, a lockfile,
a production build, or your seven original artwork files.

## 1. Copy the upgrade

Back up your current `app` folder. Merge these folders from the ZIP into the project:

- `app/` — replace the matching Level 1 files and page.tsx; add `pwa/` and manifest.ts.
- `public/` — add icons and two support pages; keep all your original assets.
- `scripts/` — add/replace the supplied scripts.

Keep your existing `app/layout.tsx`, `app/globals.css`, Next.js configuration, existing
package dependencies, and `public/assets/child wearing/` folder. Do not delete those
folders when merging. Read the package files before overwriting any custom modifications
made after the first version.

Your original image paths are unchanged:

```text
public/assets/child wearing/child.png
public/assets/child wearing/cap.png
public/assets/child wearing/shirt.png
public/assets/child wearing/pants.png
public/assets/child wearing/socks.png
public/assets/child wearing/shoes.png
public/assets/child wearing/bag.png
```

The new icons reuse the supplied child character. They do not replace your artwork.
No remote font files, icon package, PWA plugin, or additional dependency is introduced.
Existing Next.js self-hosted build fonts are included in your own offline build.

## 2. One-time setup and production build

In PowerShell, from the project root:

```powershell
node scripts/setup-pwa.mjs
node scripts/check-level1-assets.mjs
node scripts/test-level1.mjs
node scripts/test-pwa-worker.mjs
npm run build
npm run start
```

The setup script preserves your current build command and appends
`&& node scripts/build-pwa.mjs`. It adds `start` only when missing and adds the
`pwa:verify` helper. It keeps a local `package.json.before-pwa` backup and adds two
relevant .gitignore entries. Running setup a second time does not add another build
hook. No packages are installed or upgraded by this script.

The production build MUST finish with a message similar to:

```text
PWA ready: ... files, ... MB, version ...
```

`public/sw.js` is generated from YOUR build, after `next build`. It contains every
required hashed Next.js JS/CSS/static file and the seven game images. Do not copy
someone else's generated sw.js or use a static hand-written list of old JS chunk names.
A failed Next.js build must be fixed before the PWA generator can run.

Use your terminal's localhost URL (normally `http://localhost:3000`). Keep the server
running. In a second terminal you can check the production HTTP endpoints:

```powershell
npm run pwa:verify
# Or check a deployed origin:
node scripts/verify-pwa.mjs https://YOUR-DOMAIN.example
```

The verification command checks the worker, manifest and all listed asset responses.
It does not replace a browser offline test.

## 3. Test offline the right way

1. Open the **production** game while connected.
2. Wait until the header badge says **Offline ready**. Open the badge to see the file count.
3. Choose a word, type a few letters and complete at least one word to earn a star.
4. Disconnect Wi-Fi/mobile data, or select Offline in your browser's developer tools.
5. Reload. Close the game tab/app and reopen it. Check that it starts without the server.
6. Complete all six words, including items not selected before disconnecting. Check
   images, joined Arabic, marks, rewards, written Sunnah lessons, and resumed progress.
7. Reconnect and check Save / repair after deliberately clearing a cached game asset.
8. Test on an actual Android phone and iPhone before sharing it with children.

Do not call a tab that was merely left open an offline-launch test. A true test includes
closing/reopening and reloading while disconnected. Browser installation alone does not
prove that the entire offline download finished.

`npm run dev` deliberately does NOT register a new service worker: hot reload and
production precaching should not be mixed. The badge explains development mode.

**Switching from a previous production PWA back to development:** a previously installed
worker can still serve the old production shell. While connected, open
`http://localhost:3000/reset-offline.html`, choose Remove offline download, close all
old game tabs, then reopen the development URL. This deletes only this game's worker
and owned cache prefix. It leaves saved stars/current-word localStorage untouched.

## 4. Phone installation and HTTPS

For a phone, use a deployed **HTTPS** address. `http://localhost:3000` is suitable on
the development computer itself. `http://192.168.x.x:3000` on another device is ordinary
insecure HTTP and normally cannot register the worker. A trusted HTTPS test origin is
needed for the real phone PWA/offline checks. A self-signed certificate warning is not
proof that the browser considers the origin secure.

Android / supported browsers: open the offline badge after it says Offline ready.
Use Install game when the browser offers the install event; otherwise use the browser's
Install app / Add to Home screen menu. The in-page prompt is feature-detected, not assumed.

On iPhone: open the HTTPS page in Safari, open Share, then Add to Home Screen. Enable
Open as Web App when shown, then Add. Open the new home-screen icon online once and
confirm Offline ready there too. Do not assume an installed app shares all storage with
a previous browser tab or another browser.

A normal browser visit remains available when app installation is not supported.

## 5. Landscape-first phone experience

The manifest requests `orientation: "landscape"` and standalone app display. The game
uses the available viewport, safe-area insets, large tap targets and a landscape layout.
It never rotates the whole DOM sideways or disables pinch zoom.

On a portrait touch device, a native dialog says:

> Turn your phone sideways to play.
> This game is best in landscape.

The dialog closes when the phone is turned sideways. Continue in portrait remains
available for accessibility and for users who cannot rotate their device. A full-screen
control is shown only where supported; an orientation-lock request is best effort.
Some browsers/device settings do not allow a web page to force orientation. The visible
rotation advice remains the fallback.

In short landscape windows (560px+ wide and up to 600px high), the character stays on
the left and the word/letter/mark controls stay on the right. The page itself does not
need to scroll. Very short panels can scroll internally rather than shrinking important
controls below 44px. A long letter tray can scroll horizontally on the smallest phones.
The success lesson changes to a two-column dialog in landscape. Portrait, tablet and
desktop layouts still work. Rotating the device does not clear the current word.

## 6. Exactly what is saved offline

The generated worker precaches:

- The static home-page HTML and every built `/_next/static/` file except source maps.
- All seven existing child/clothing pictures, PWA manifest, app icons and fallback page.
- A default app/favicon.ico route when that file exists.
- Optional audio files under `public/audio` with mp3, m4a, ogg, wav or webm extensions.

All six words and written lessons are part of the compiled game code, so a child does
not need to open each word first. The game uses only local play logic.

**First use requires the internet** to obtain this complete download. External hadith
and dictionary pages are not saved. A browser may evict local caches under storage
pressure. Keep offline files requests persistence where available, but a browser can
refuse that request. Clearing website data removes the relevant local data even after
installation. This is not an unlimited or permanent-storage promise.

The existing stars/settings key is preserved; current item and letter/mark tokens are
now saved too. The code sanitizes saved input and accepts older progress objects.
There is no cloud sync or automatic transfer between devices/apps/browsers.

## 7. Spoken audio is separate from written offline learning

The game does not contain teacher-recorded voice files. With no installed local Arabic
voice, Listen is disabled; the written game and Masha Allah reward still work.

For reliable classroom pronunciation, add teacher-reviewed recordings locally:

```text
public/audio/cap.mp3
public/audio/shirt.mp3
public/audio/pants.mp3
public/audio/socks.mp3
public/audio/shoes.mp3
public/audio/bag.mp3
public/audio/masha-allah.mp3
```

In `app/level-one/content.ts`, add `audioSrc: "/audio/shirt.mp3"` to the corresponding
item, and set `SUCCESS_AUDIO` to `"/audio/masha-allah.mp3"`. Repeat for the other items.
Rebuild and redeploy afterward. These files are precached even before first playback,
and cached audio supports byte-range requests. Test the actual audio codec on target
phones. Do not substitute unreviewed synthetic recitation for classroom review.

Installed local speech voices are provided by the device, not downloaded by this PWA.
The application never silently switches to a remote speech service.

## 8. Updates and deployment

Each build receives a content-derived cache version. The existing complete version
keeps serving its matching HTML and chunks until a new complete worker is ready.
Updates wait rather than forcibly interrupting a child. The offline panel then offers
Update & restart. Current-word progress is saved before the user chooses to restart.

One previous complete cache is retained for older open tabs; unrelated application
caches are not deleted. Open tabs from much older versions should be refreshed.
Missing/failed downloads cannot set the Offline ready marker. Save / repair fills
missing files instead of downloading an already complete cache again.

For Next.js hosting, set the deployment Build Command to **npm run build** so the
post-build generator runs. Deploy all normal Next.js output plus public files. Do not
serve sw.js through a rewrite to HTML or an authentication redirect. Prefer a dedicated
origin for this root-scope game. Do not add basePath or external assetPrefix without
adapting the generator, manifest, registration scope and asset URLs together.

The generator expects the usual `.next` build folder and a prerendered root page.
It also copies sw.js into an existing `out/` folder after static export, but a full
static-export deployment was not tested here. Custom build adapters/standalone copying
must include the generated public/sw.js and other public files explicitly.

Recommended headers when configuring your host (merge with existing headers):

```text
/sw.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: no-cache, no-store, must-revalidate
  Service-Worker-Allowed: /
```

The registration also uses `updateViaCache: "none"`. Never make this worker permanently
immutable in a CDN. The worker handles only the root game and listed local files;
APIs, POST requests and RSC requests do not receive an offline HTML fallback. Future
levels, dynamic routes, logins or private content require a reviewed cache strategy.

## 9. Verification performed for this delivery

Passed:

- 174 pure game/progress assertions, covering all six words, Arabic marks, duplicate-star
  prevention, existing-save compatibility, and sanitized current-word restoration.
- 31 service-worker assertions in Node with simulated network and CacheStorage:
  full precache; no-network cached reads; failed install; readiness after eviction;
  repair; audio ranges; safe update activation; previous-version access; unrelated
  caches left alone; API/POST/RSC/external requests excluded.
- Production-shaped generator and 17 HTTP endpoint checks in a local React QA fixture.
- Chromium UI rendering at 844×390, 667×375, 568×320, 932×430, 1024×768 and 1280×800.
  All six item screens had no page-wide horizontal overflow. Short landscape touch
  controls tested at 44px or larger. Portrait reminder and fallback checked at 390×844.
- Six correct-word/reward flows, completion, orientation changes retaining the word,
  and the offline-information dialog; no JavaScript page errors in the UI fixture.

The UI fixture uses mocked PWA status and an in-memory progress store. The screenshots
show the rendered layout, not a deployed installed app. The worker tests are simulations.
A **full Next.js production build, real browser service-worker cold launch, actual
Android/iOS installation, device orientation locking, device voice playback, and
real low-storage eviction were NOT verified here**. Run the production and physical-
device checks above before classroom deployment. The user's local project was not edited.

## Technical references

Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
Service worker lifecycle and HTTPS: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
Manifest orientation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/orientation
Orientation lock limitations: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
Installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
Storage persistence: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
Apple home-screen web apps: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

Original vocabulary and lesson references remain in content.ts and README_LEVEL1.md.
