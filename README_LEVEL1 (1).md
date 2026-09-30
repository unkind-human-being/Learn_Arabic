# Learn Arabic — Wear to Madrasa (PWA edition)

**Start with `START_HERE_PWA.md` for installation, production builds, offline testing,
and phone installation.** This edition replaces the earlier online-only source package.

The existing child and outfit PNG files remain in your project. This package contains
updated source, PWA icons, build scripts, and documentation, not a second Next.js project.
It preserves the existing vocabulary, reward text, and referenced lesson content.

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


## Local storage and privacy — PWA edition

The existing `learn-arabic:wear-to-madrasa:v1` key remains compatible. The saved object
now also contains the selected item and current input tokens. Old saves without these
fields still work. Invalid saved tokens are rejected during hydration. Correctly
completed words earn one unique star each, even when practised again.

The app does not collect names, email addresses, microphone audio, analytics or ad IDs.
No account, cloud database, chat or blockchain is added. Hosting providers may retain
ordinary request logs. Reference links go to third-party sites only when opened.

The compiled game, seven clothing images, written lessons and optionally supplied
recordings are cached locally after a complete first online download. The code displays
`Offline ready` only after all required files and the ready marker exist. Local speech
voices are outside the service worker cache; install a suitable voice or provide
teacher-reviewed recordings. Deleting website data can erase stars and offline files.

See `START_HERE_PWA.md` for the exact testing performed and the remaining real-device
checks before classroom deployment.
