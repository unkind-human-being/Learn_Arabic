# Learn Arabic — Basic Level 1: Wear to Madrasa

A playable frontend for your existing Next.js App Router + TypeScript project.
Choose something the child is wearing, build its Arabic word from letters and
marks, earn a star, and discover a short sourced Sunnah lesson.

## 1. Install in your existing project

You already created `learn_arabic`. Do not create a second Next.js application.

1. Extract this ZIP somewhere outside your project.
2. Back up your existing `app/page.tsx` outside `app/`, for example as
   `backups/page-before-level1.txt`.
3. Merge the ZIP's `app/` folder into your existing `app/`. Replace ONLY
   `app/page.tsx` when asked. Add the new `app/level-one/` folder.
4. Copy the ZIP's `scripts/` folder into your project, merging it with any
   existing scripts folder. The two script names are specific to this level.
5. Keep your existing `app/layout.tsx`, `app/globals.css`, `package.json`,
   configuration files, `node_modules`, and all your artwork.

Do not delete the whole existing `app/` folder. This is a copy-in source package,
not a replacement for your entire project. It adds no runtime dependencies.

Final relevant structure:

```text
learn_arabic/
├── app/
│   ├── layout.tsx                    # Keep yours
│   ├── globals.css                   # Keep yours
│   ├── page.tsx                      # Replace with this package's file
│   └── level-one/                    # Add this folder
│       ├── LearnArabicGame.tsx
│       ├── level-one.module.css
│       ├── content.ts
│       ├── arabic.ts
│       └── model.ts
├── scripts/
│   ├── check-level1-assets.mjs
│   └── test-level1.mjs
└── public/
    └── assets/
        └── child wearing/            # Keep this exact name, including the space
            ├── child.png
            ├── cap.png
            ├── shirt.png
            ├── pants.png
            ├── socks.png
            ├── shoes.png
            └── bag.png
```

The source package does not contain your PNGs, recordings, or font files. It uses
the images already shown in your VS Code project. Filenames are lowercase and
case-sensitive on many hosting systems.

In the VS Code terminal, from `learn_arabic`, run:

```powershell
node scripts/check-level1-assets.mjs
node scripts/test-level1.mjs
npm run dev
```

Open the local address printed by Next.js, normally:

```text
http://localhost:3000
```

Use `npm install` first only when your existing project dependencies have not yet
been installed. Your screenshot already shows `node_modules`.

Before deployment, also run:

```powershell
npm run build
```

Next.js serves files under `public/` from the URL root, so the code uses
`/assets/child%20wearing/child.png`, not `/public/assets/...`.
Reference: https://nextjs.org/docs/app/api-reference/file-conventions/public-folder

## 2. What the child does

Tap a clothing item directly on the child, its label, or one of the six picture
buttons. A picture clue and English name appear beside the word builder.

The default Guide shows the target word and highlights the next tile. The child
adds letters and marks one at a time. The growing word is one connected Arabic
text string, not separated letter boxes. The child can undo one tap, clear the
word, use a hint, or turn the guide off to practise recall.

Example — Shirt:

```text
Qaf → Fatha → Meem → Kasra → Ya → Sad
قَمِيص
```

Tap **Check word**. A correct word shows **MASHA ALLAH!**, earns one star, and
opens a child-friendly lesson with a practical activity. There are six unique
stars; repeating a word never adds a duplicate. Mistakes do not remove stars.
After all six words, the child sees **Ready for Madrasa!** and a word collection.

There is no timer, life counter, purchase, account, or competitive leaderboard.
The Grown-ups panel contains teaching notes, references, and a confirmed reset.

## 3. Vocabulary and Arabic handling

| Picture | Word used | Approximate reading | Reference |
|---|---|---|---|
| Cap | طَاقِيَّة | taa-qiy-yah | Riyadh Dictionary, King Salman Global Academy for Arabic Language |
| Shirt | قَمِيص | qa-mees | Wiktionary, قميص |
| Pants | سِرْوَال | sir-waal | Wiktionary, سروال |
| Socks | جَوَارِب | ja-waa-rib | Plural listed under Wiktionary, جورب |
| Shoes | أَحْذِيَة | ah-dhi-yah | Madinah Arabic, shoe vocabulary |
| Bag | حَقِيبَة | ha-qee-bah | Wiktionary, حقيبة |

Full vocabulary URLs are stored beside each item in `content.ts` and linked in
the Grown-ups panel. Latin hints are approximate; they cannot convey every Arabic
sound and do not replace a teacher or a checked recording.

This basic level teaches standalone forms without final grammatical case endings.
Socks and shoes are plural forms, matching the English labels. Pants uses the
Arabic clothing noun سِرْوَال.

**Fatha, Kasra, and Damma are vowel marks, not separate alphabet letters.**
Sukun and Shadda are also marks. Each mark tile displays a dotted circle to show
its position; the circle is never inserted into the answer. Marks attach to the
last entered letter. A long-vowel letter does not automatically need a new mark.

The cap needs Shadda. The shoes word starts with **أ**, Alif with hamza, rather
than plain **ا**. Both distinctions matter when checking an answer.

Arabic displays right to left. Browser font shaping joins letters where Arabic
joining rules permit; not every neighboring pair can join. The implementation
keeps the answer as a single Unicode string and applies NFC normalization. It
accepts either input order for Fatha and Shadda on the same letter, but never
strips the harakat to make an incorrect answer pass.

Arabic-script layout reference:
https://www.w3.org/TR/alreq/ (W3C Group Draft Note; a work in progress)

## 4. Sunnah lesson sources

The game separates three things: a simplified meaning, a practical activity, and
the source. Child-friendly wording is a paraphrase, not a verbatim hadith quote.

| Item | Teaching or application | Source |
|---|---|---|
| Cap | Enjoy nice clothes without looking down on other people. This does not assert that the depicted cap is required. | Sahih Muslim 91a — https://sunnah.com/muslim:91a |
| Shirt | Begin with the right side when dressing; practise with the right sleeve. | Sunan Abi Dawud 4141 — https://sunnah.com/abudawud:4141 |
| Pants | Apply the general dressing instruction by starting with the right leg. | Sunan Abi Dawud 4141 |
| Socks | Apply the general dressing instruction by putting the right sock on first. | Sunan Abi Dawud 4141 |
| Shoes | Put the right shoe on first; take the left shoe off first. | Sahih al-Bukhari 5855 — https://sunnah.com/bukhari:5855 |
| Bag | Prepare for learning, connected to the teaching about seeking knowledge. No special school-bag narration is claimed. | Sahih Muslim 2699a — https://sunnah.com/muslim:2699a |

The linked source grades Abu Dawud 4141 Sahih (Al-Albani).
Have a qualified Arabic/Madrasa teacher review the vocabulary, pronunciation,
recordings, and simplified lessons before a classroom release.

## 5. Audio

The visual game works without audio. The Listen button uses an installed Arabic
speech voice marked as local by the browser. It does not silently send a child's
text to a remote speech service. Voice availability and pronunciation quality
vary by device. A missing Arabic voice leaves Listen disabled rather than playing
an English voice as though it were correct Arabic.

A correct answer ALWAYS shows MASHA ALLAH! as text. It is spoken only when a local
Arabic voice or an optional success recording is available. There are no bundled
recordings. Spoken output was not audibly verified in the test environment.

For reliable classroom pronunciation, add teacher-reviewed recordings:

```text
public/audio/shirt.mp3
public/audio/cap.mp3
public/audio/pants.mp3
public/audio/socks.mp3
public/audio/shoes.mp3
public/audio/bag.mp3
public/audio/masha-allah.mp3
```

Then, in the corresponding item in `app/level-one/content.ts`, add:

```ts
audioSrc: "/audio/shirt.mp3",
```

And replace the existing success-audio declaration with:

```ts
export const SUCCESS_AUDIO: string | undefined = "/audio/masha-allah.mp3";
```

Do not add these paths before the matching recordings exist. A recording failure
falls back to a local voice where available. Audio can be switched off at the top.

API reference:
https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

## 6. Your artwork and click regions

This first version is an object-selection/word-building game. **The child stays
fully dressed.** The separate cap, shirt, pants, socks, shoes, and bag PNGs are
picture clues; they are not individually composited dress-up layers.

`content.ts` contains each item's `areas` (click regions) and `label` position.
Coordinates are percentages of the complete `child.png` canvas. They were set
for the approximately 1122 × 1402 image shown in your project. Transparent
padding and cropping affect alignment. Test clicks on your exact local image
and adjust those percentages when needed. The visible labels and picture
buttons remain alternate ways to choose every item.

A transparent PNG gives the cleanest integration. The CSS also accommodates
light backgrounds using blend styling. No illustration is modified by this code.

## 7. Storage, privacy, and scope

Only six-word completion and Guide/Sound settings are stored in this browser's
localStorage, under `learn-arabic:wear-to-madrasa:v1`. No names, email addresses,
recordings, microphone input, advertising, analytics, or chat are implemented.
Hosting providers may retain their normal access logs. Source links are available
in the Grown-ups panel; it is not a security-enforced parental gate.

Progress does not synchronize between devices or browsers. It can disappear when
browser data is cleared. When localStorage is blocked, the game remains playable
but shows that progress lasts only for the current visit.

This package does not include a service worker, PWA installation, cloud database,
login, or blockchain. A hosted first load or refresh still requires access to the
host. A local development server works after dependencies are installed; existing
Next.js scaffold font/build settings may have their own network requirements.

## 8. Testing and limits

Completed during preparation:

- 167 passing pure-logic assertions covering all six exact answers, every expected
  next tile, missing marks, invalid mark combinations, alternate Shadda/Fatha
  order, hamza distinction, unique rewards, saved-data validation, and reset.
- Strict TypeScript checking of `content.ts`, `arabic.ts`, and `model.ts`.
- An actual React component browser test using Chromium: all six words, success
  dialogs, final completion, reset, Escape dismissal, desktop and 320/390/768 px
  responsive layouts. No page errors or horizontal overflow in those checks.
- Visual inspection using the earlier child/outfit artwork available in Library.

The browser test used an isolated React harness, not a complete Next.js server.
A full Next.js build and full React/Next type/lint run were not executed here.
Native reload persistence and audible speech were not verified in that isolated
browser. Run `npm run build`, refresh to check saved stars, and test Listen on
your own browser before deployment.

`scripts/test-level1.mjs` repeats the 167 logic assertions using your installed
TypeScript package. It does not substitute for a full production build.

## 9. Quick troubleshooting

**Image missing:** Run `node scripts/check-level1-assets.mjs` from the project
root. Check lowercase filenames, the exact space in `child wearing`, and that
images are under `public/assets`, not `app/public`.

**Still seeing the starter homepage:** Confirm you replaced the root `app/page.tsx`
shown in your screenshot, not a different project's file. Restart `npm run dev`.

**An alias or dependency error:** These files use relative imports and require no
new UI library. Confirm every file in `app/level-one/` was copied. Do not replace
your existing package.json with a different project's configuration.

**Listen is disabled:** Your browser has no usable local Arabic voice and no
teacher recording was configured. The word builder still works normally.

**Marks look different:** The game uses system Arabic font fallbacks, not a
bundled font. Check the target classroom devices. Keep formed words as a single
text node and do not add letter spacing, spaces, or separate character spans.

**Click regions do not match:** Adjust `areas` in `content.ts` to the exact crop of
your local child image. Labels and the six picture choices work independently.
