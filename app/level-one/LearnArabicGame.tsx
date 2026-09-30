"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { CHILD_IMAGE, ITEMS, STORAGE_KEY, SUCCESS_AUDIO, getItem, itemImage, type ClothingItem, type ItemId } from "./content";
import { MARKS, isMark, joinedWord, letterBank, nextExpectedToken, tokenDisplay, tokenName, wordsMatch } from "./arabic";
import { INITIAL_STATE, parseProgress, reducer } from "./model";
import styles from "./level-one.module.css";
import PwaExperience from "../pwa/PwaExperience";

type IconName = "book" | "star" | "sound" | "mute" | "help" | "arrow" | "undo" | "spark" | "check" | "close" | "shield";
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    book: <><path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v15M6 9h3M15 9h3"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
    sound: <><path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></>,
    mute: <><path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 4h.01"/></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
    undo: <><path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7v2"/></>,
    spark: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/><path d="m20 2 1 3m-2-1 3-1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "star" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Asset({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`${styles.missingAsset} ${className ?? ""}`}><Icon name="book"/><span>{alt || "Picture"}</span><small>Check {decodeURIComponent(src.split("/").at(-1) ?? "image")}</small></span>;
  // These are the user's existing local PNGs, with unknown transparency/content bounds.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} draggable={false} onError={() => setFailed(true)} />;
}

function Modal({ open, titleId, onClose, children }: { open: boolean; titleId: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open) dialog.showModal();
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = oldOverflow;
        if (dialog.open) dialog.close();
        // A reset/next word can remove the original opener from the DOM.
        // Restore focus without scrolling to the hidden skip link.
        const focusTarget = previousFocus?.isConnected ? previousFocus : document.getElementById("word-builder");
        focusTarget?.focus({ preventScroll: true });
      };
    }
    if (dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={styles.modal} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <button type="button" className={`${styles.iconButton} ${styles.modalClose}`} aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button>
    {children}
  </dialog>;
}

export default function LearnArabicGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioSession = useRef(0);
  const builderRef = useRef<HTMLElement>(null);
  const selected = getItem(state.selected);
  const complete = state.completed.length === ITEMS.length;
  const guideVisible = state.guide || state.hint;
  const next = selected ? nextExpectedToken(state.input, selected.steps) : null;
  const arabicVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ar") && voice.localService);
  const englishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && voice.localService);

  useEffect(() => {
    let saved = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch { setStorageUnavailable(true); }
    dispatch({ type: "hydrate", data: parseProgress(saved) });
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      window.speechSynthesis.cancel();
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, completed: state.completed, guide: state.guide, sound: state.sound, selected: state.selected, input: state.input }));
    } catch { setStorageUnavailable(true); }
  }, [state.hydrated, state.completed, state.guide, state.sound, state.selected, state.input]);

  function stopAudio() {
    audioSession.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function say(text: string, language: "ar" | "en", audioSrc?: string) {
    if (!state.sound) { dispatch({ type: "message", text: "Sound is off. Use the sound button to turn it on." }); return; }
    stopAudio();
    const session = audioSession.current;
    const fallback = () => {
      if (session !== audioSession.current) return;
      const voice = language === "ar" ? arabicVoice : englishVoice;
      if (!voice || !("speechSynthesis" in window)) {
        dispatch({ type: "message", text: "A grown-up can read with you. Audio needs a local voice or a teacher recording." });
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = language === "ar" ? 0.78 : 0.88;
      utterance.onerror = (event) => { if (session === audioSession.current && event.error !== "canceled" && event.error !== "interrupted") dispatch({ type: "message", text: "The voice could not play. You can keep learning without audio." }); };
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    if (!audioSrc) { fallback(); return; }
    const audio = new Audio(audioSrc);
    audioRef.current = audio;
    void audio.play().catch(fallback);
  }

  function focusBuilder() {
    if (window.matchMedia("(max-width: 760px) and (orientation: portrait)").matches) {
      requestAnimationFrame(() => builderRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    }
  }
  function choose(id: ItemId) { stopAudio(); dispatch({ type: "select", id }); focusBuilder(); }
  function checkWord() {
    if (selected && wordsMatch(state.input, selected.arabic) && state.sound && (arabicVoice || SUCCESS_AUDIO)) say("مَا شَاءَ اللَّهُ", "ar", SUCCESS_AUDIO);
    dispatch({ type: "check" });
  }
  function closeModal() { stopAudio(); dispatch({ type: "overlay", overlay: null }); }
  function continueLearning() { stopAudio(); dispatch({ type: "continue" }); focusBuilder(); }
  const modalTitle = state.overlay === "success" ? "success-title" : state.overlay === "complete" ? "complete-title" : state.overlay === "teacher" ? "teacher-title" : state.overlay === "reset" ? "reset-title" : "help-title";

  return <div className={styles.game}>
    <a className={styles.skipLink} href="#word-builder">Skip to word builder</a>
    <header className={styles.header}>
      <div className={styles.brand}><span className={styles.brandMark}><Icon name="book" size={27}/></span><div><strong>Learn Arabic<span className={styles.brandDot}>.</span></strong><small>Little words. Beautiful habits.</small></div></div>
      <nav className={styles.headerActions} aria-label="Game settings">
        <PwaExperience gameDialogOpen={state.overlay !== null} />
        <button type="button" className={styles.textButton} aria-label="Grown-ups" onClick={() => dispatch({ type: "overlay", overlay: "teacher" })}><Icon name="shield" size={18}/><span>Grown-ups</span></button>
        <button type="button" className={styles.iconButton} aria-label={state.sound ? "Turn sound off" : "Turn sound on"} aria-pressed={state.sound} onClick={() => { stopAudio(); dispatch({ type: "sound" }); }}><Icon name={state.sound ? "sound" : "mute"}/></button>
        <button type="button" className={styles.iconButton} aria-label="How to play" onClick={() => dispatch({ type: "overlay", overlay: "help" })}><Icon name="help"/></button>
      </nav>
    </header>

    <main className={styles.main}>
      <section className={styles.intro} aria-labelledby="level-title">
        <div><div className={styles.eyebrow}><span>BEGINNER</span><span className={styles.levelPill}>BASIC · LEVEL 1</span></div><h1 id="level-title">Wear to <span>Madrasa</span></h1><p>Pick a picture. Build a word. Learn a beautiful habit.</p></div>
        <div className={styles.progressBox}>
          <div className={styles.progressTop}><strong>Your word stars</strong><span data-testid="progress-count">{state.completed.length} / {ITEMS.length}</span></div>
          <div className={styles.stars} aria-label={`${state.completed.length} of ${ITEMS.length} words learned`}>{ITEMS.map((item) => <span key={item.id} title={`${item.english}: ${state.completed.includes(item.id) ? "learned" : "not yet"}`} className={state.completed.includes(item.id) ? styles.earnedStar : styles.emptyStar}><Icon name="star" size={25}/></span>)}</div>
          {complete && <button className={styles.linkButton} onClick={() => dispatch({ type: "overlay", overlay: "complete" })}>See your celebration <Icon name="arrow" size={16}/></button>}
        </div>
      </section>

      <div className={styles.board}>
        <section className={styles.picturePanel} aria-labelledby="picture-heading">
          <div className={styles.panelLabel}><span className={styles.stepNumber}>1</span><h2 id="picture-heading">Pick something to wear</h2><span className={styles.tapTag}>TAP & LEARN</span></div>
          <div className={styles.scene}>
            <div className={styles.sceneArch} aria-hidden="true"/><span className={styles.sceneSparkOne} aria-hidden="true">✦</span><span className={styles.sceneSparkTwo} aria-hidden="true">✧</span>
            <div className={styles.characterCanvas}>
              <Asset src={CHILD_IMAGE} alt="A child ready for Madrasa, wearing a cap, shirt, pants, socks, shoes and a bag." className={styles.character}/>
              {ITEMS.flatMap((item) => item.areas.map((area, index) => <button key={`${item.id}-${index}`} type="button" tabIndex={-1} aria-hidden="true" title={item.english} className={`${styles.hitArea} ${selected?.id === item.id ? styles.selectedArea : ""}`} style={{ left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%` }} onClick={() => choose(item.id)}/>))}
              {ITEMS.map((item) => <button type="button" key={item.id} aria-label={`Select ${item.english} on the child`} aria-pressed={selected?.id === item.id} className={`${styles.hotspotLabel} ${item.label.side === "left" ? styles.labelLeft : styles.labelRight} ${selected?.id === item.id ? styles.activeLabel : ""}`} style={{ top: `${item.label.top}%` }} onClick={() => choose(item.id)}>
                <span className={styles.hotspotDot}>{state.completed.includes(item.id) ? <Icon name="check" size={12}/> : null}</span>{item.english}
              </button>)}
            </div>
          </div>
          <p className={styles.sceneHint}><Icon name="spark" size={17}/>{selected ? `You picked the ${selected.english.toLowerCase()}. Let's build its word!` : "Tap the clothes, a label, or a picture below."}</p>
          <div className={styles.itemDock} aria-label="Clothing picture choices">
            {ITEMS.map((item) => <button type="button" key={item.id} aria-label={`Choose ${item.english}`} aria-pressed={selected?.id === item.id} className={`${styles.itemCard} ${selected?.id === item.id ? styles.activeCard : ""} ${state.completed.includes(item.id) ? styles.learnedCard : ""}`} onClick={() => choose(item.id)}>
              {state.completed.includes(item.id) && <span className={styles.itemCheck}><Icon name="check" size={12}/></span>}
              <Asset src={itemImage(item.id)} alt="" className={styles.itemThumb}/><span>{item.english}</span>
            </button>)}
          </div>
        </section>

        <section className={styles.builderPanel} data-selected={Boolean(selected)} id="word-builder" ref={builderRef} tabIndex={-1} aria-labelledby="builder-heading">
          <div className={styles.panelLabel}><span className={styles.stepNumber}>2</span><h2 id="builder-heading">Build the Arabic word</h2><button type="button" className={`${styles.guideToggle} ${state.guide ? styles.guideOn : ""}`} aria-pressed={state.guide} onClick={() => dispatch({ type: "guide" })}>Guide {state.guide ? "on" : "off"}</button></div>
          {!selected ? <div className={styles.welcome}>
            <div className={styles.welcomeTiles} aria-hidden="true"><span lang="ar">أ</span><span lang="ar">ب</span><span lang="ar">ت</span></div>
            <span className={styles.smallBadge}>YOUR FIRST LITTLE ADVENTURE</span>
            <h3>Let’s get ready<br/>for Madrasa!</h3><p>Choose something on the child.<br/>Then put its Arabic word together.</p>
            <button type="button" className={styles.primaryButton} onClick={() => choose("shirt")}>Start with the shirt <Icon name="arrow"/></button>
            <div className={styles.welcomeNote}><Icon name="star"/><span>Six words to discover.<br/><strong>No timer. Take your time.</strong></span></div>
          </div> : <>
            <div className={styles.objectPrompt}>
              <div className={styles.objectPreview}><Asset key={selected.id} src={itemImage(selected.id)} alt={selected.english} className={styles.objectImage}/></div>
              <div className={styles.objectTitle}><span className={styles.caption}>THE ENGLISH WORD IS</span><h3>{selected.english}</h3><span className={styles.pronunciation}>{guideVisible ? selected.pronunciation : "Build it from memory"}</span></div>
              <button type="button" className={styles.listenButton} disabled={!state.sound || (!arabicVoice && !selected.audioSrc)} title={arabicVoice || selected.audioSrc ? "Hear the Arabic word" : "Add a local Arabic voice or teacher recording to enable audio"} onClick={() => say(selected.arabic, "ar", selected.audioSrc)}><Icon name="sound"/><span>Listen</span></button>
            </div>
            <div className={styles.guideRow}><span>{guideVisible ? "WORD TO BUILD" : "YOU’VE GOT THIS"}</span>{guideVisible ? <span lang="ar" dir="rtl" className={styles.guideWord}>{selected.arabic}</span> : <span className={styles.hiddenGuide}>Need a little help? Tap Hint.</span>}</div>
            <div className={`${styles.wordPad} ${state.attention ? styles.attentionPad : ""}`}>
              <div className={styles.padTop}><span>YOUR WORD</span><span>← Arabic goes right to left</span></div>
              <div className={styles.wordLine} aria-label="Your Arabic word" aria-live="polite" aria-atomic="true">
                {state.input.length ? <span lang="ar" dir="rtl" className={styles.formedWord} data-testid="formed-word">{joinedWord(state.input)}</span> : <span className={styles.wordPlaceholder}>Tap a letter to begin</span>}
              </div>
              <div className={styles.padBottom}><span>{state.input.length} / {selected.steps.length} tiles</span><div><button type="button" className={styles.smallButton} disabled={!state.input.length} onClick={() => dispatch({ type: "undo" })}><Icon name="undo" size={17}/>Undo</button><button type="button" className={styles.smallButton} disabled={!state.input.length} onClick={() => dispatch({ type: "clear" })}>Clear</button></div></div>
            </div>
            <div className={`${styles.feedback} ${state.attention ? styles.attentionText : ""}`} role="status" aria-live="polite">
              <Icon name={state.attention ? "help" : "spark"} size={18}/><span>{state.message || (guideVisible && next ? `Next: ${tokenName(next)}. ${isMark(next) ? "The mark joins the last letter." : "Tap its letter tile below."}` : wordsMatch(state.input, selected.arabic) ? "Looking good! Tap Check word." : "Choose letters, then add their marks.")}</span>
            </div>
            <div className={styles.trayHeading}><h3>Arabic letters</h3><span>Tap in word order</span></div>
            <div className={styles.letterTray} dir="rtl" aria-label="Arabic letter tiles">
              {letterBank(selected.steps).map((char) => <button type="button" key={char} aria-label={`Add ${tokenName(char)}`} data-token={char} className={`${styles.letterTile} ${guideVisible && next === char ? styles.hintTile : ""}`} onClick={() => dispatch({ type: "tile", char })}><span className={styles.tileGlyph} lang="ar">{char}</span><span className={styles.tileName} dir="ltr">{tokenName(char)}</span></button>)}
            </div>
            <div className={styles.trayHeading}><h3>Vowels & marks</h3><span>Attach to the last letter</span></div>
            <div className={styles.markTray} aria-label="Arabic vowel and mark tiles">
              {MARKS.map((mark) => <button type="button" key={mark.char} aria-label={`Add ${mark.name}`} title={mark.sound} data-token={mark.char} className={`${styles.markTile} ${guideVisible && next === mark.char ? styles.hintTile : ""}`} onClick={() => dispatch({ type: "tile", char: mark.char })}><span className={styles.markGlyph} lang="ar" dir="rtl">{tokenDisplay(mark.char)}</span><span className={styles.tileName}>{mark.name}</span></button>)}
            </div>
            <div className={styles.builderActions}><button type="button" className={styles.hintButton} aria-label="Hint" onClick={() => dispatch({ type: "hint" })}><Icon name="spark"/><span>Hint</span></button><button type="button" className={styles.primaryButton} aria-label="Check word" disabled={!state.input.length} onClick={checkWord}><span className={styles.checkLabel}>Check word</span><span className={styles.shortCheckLabel} aria-hidden="true">Check</span> <Icon name="check"/></button></div>
            <p className={styles.builderFootnote}>The dotted circle only shows where a mark sits. It is not a letter.</p>
          </>}
        </section>
      </div>
      <footer className={styles.footer}><span><Icon name="shield" size={16}/> {storageUnavailable ? "Progress lasts for this visit. Browser saving is unavailable." : "Stars are saved on this browser. No account needed."}</span><span>Small steps. Happy learning.</span></footer>
    </main>

    <Modal open={state.overlay !== null} titleId={modalTitle} onClose={closeModal}>
      {state.overlay === "success" && selected && <div className={styles.successContent}>
        <div className={styles.successCelebration}><div className={styles.rewardIcon}><Icon name="star" size={42}/><span aria-hidden="true">✦</span><span aria-hidden="true">✧</span></div>
        <span className={styles.smallBadge}>A BEAUTIFUL LITTLE ACHIEVEMENT</span><h2 id="success-title">MASHA ALLAH!</h2><p>You built the word for <strong>{selected.english.toLowerCase()}</strong>!</p>
        <div className={styles.successWord}><Asset key={selected.id} src={itemImage(selected.id)} alt="" className={styles.successImage}/><span lang="ar" dir="rtl">{selected.arabic}</span></div></div>
        <div className={styles.lessonCard}><div className={styles.lessonKicker}><Icon name="book" size={18}/>A LITTLE SUNNAH LESSON</div><h3>{selected.lesson.title}</h3><p>{selected.lesson.meaning}</p><div className={styles.tryToday}><strong>Try it today</strong><p>{selected.lesson.activity}</p></div><small>Child-friendly meaning · {selected.lesson.source}</small></div>
        <button type="button" className={styles.primaryButton} onClick={continueLearning}>{complete ? "I’m ready for Madrasa!" : "Learn the next word"}<Icon name="arrow"/></button>
        {state.sound && englishVoice && <button type="button" className={styles.linkButton} onClick={() => say(`${selected.lesson.title}. ${selected.lesson.meaning.replace("ﷺ", "peace and blessings be upon him")}. ${selected.lesson.activity}`, "en")}><Icon name="sound" size={16}/>Read the lesson to me</button>}
      </div>}
      {state.overlay === "complete" && <div className={styles.completeContent}>
        <div className={styles.rewardIcon}><Icon name="star" size={50}/></div><span className={styles.smallBadge}>BASIC · LEVEL 1 COMPLETE</span><h2 id="complete-title">Ready for Madrasa!</h2><p>Masha Allah! You discovered all six words.<br/>Keep practising your words and beautiful habits.</p>
        <div className={styles.wordCollection}>{ITEMS.map((item) => <div key={item.id}><Asset src={itemImage(item.id)} alt="" className={styles.collectionImage}/><span lang="ar" dir="rtl">{item.arabic}</span><small>{item.english}</small></div>)}</div>
        <button type="button" className={styles.primaryButton} onClick={closeModal}>Practise any word <Icon name="arrow"/></button><p className={styles.builderFootnote}>Your six stars stay with you when you practise.</p>
      </div>}
      {state.overlay === "help" && <div className={styles.helpContent}>
        <span className={styles.smallBadge}>LET’S LEARN TOGETHER</span><h2 id="help-title">How to play</h2><p className={styles.landscapeTip}>On a phone, turn the screen sideways. Landscape gives your word more room!</p>
        <div className={styles.helpStep}><span>1</span><div><h3>Choose a picture</h3><p>Tap the child’s clothes, a label, or one of the pictures below.</p></div></div>
        <div className={styles.helpStep}><span>2</span><div><h3>Build from right to left</h3><p>Tap a letter, then its vowel or mark. The letters join into a real word. The glowing tile helps you with the next step.</p></div></div>
        <div className={styles.helpStep}><span>3</span><div><h3>Check and discover</h3><p>Tap Check word. A correct word earns a star and reveals a short Sunnah lesson. Mistakes never take your stars away.</p></div></div>
        <div className={styles.helpNote}><strong>Vowel marks are not alphabet letters.</strong><p>Fatha gives a short “a”, Kasra a short “i”, and Damma a short “u”. Sukun means no vowel; Shadda doubles the consonant.</p><p>The cap word needs Shadda. The shoes word begins with <b lang="ar">أ</b> — Alif with hamza — not plain <b lang="ar">ا</b>.</p></div>
        <button type="button" className={styles.primaryButton} onClick={closeModal}>Let’s play <Icon name="arrow"/></button>
      </div>}
      {state.overlay === "teacher" && <div className={styles.teacherContent}>
        <span className={styles.smallBadge}>FOR PARENTS & TEACHERS</span><h2 id="teacher-title">A little help behind the scenes</h2>
        <h3>Teaching approach</h3><p>This basic level uses a visible word guide, separate letters and harakat, unlimited retries, and optional pronunciation. Turn Guide off to practise recall. Words use standalone forms without final case endings. Latin pronunciation hints are approximate; they do not replace an Arabic teacher.</p>
        <h3>Audio & privacy</h3><p>Only installed local speech voices are used. A local Arabic voice is {arabicVoice ? "available" : "not available"} on this browser. Teacher recordings can be added in content.ts. No microphone, account, analytics, advertising, chat, or player-name collection is included. Stars and settings are stored only in this browser; hosting providers may keep their normal request logs.</p>
        <p>This version is an installable PWA. Open it online and wait for “Offline ready” before disconnecting. The game, all six words, pictures, and lesson text then work offline. Stars and your current word are saved locally. Teacher audio files in public/audio are included at build time; device voices are not guaranteed. External reference links require a connection. Clearing website data or browser storage cleanup can remove offline files and progress. Use the offline badge for installation, repair, and update settings.</p>
        <h3>Lesson sources</h3><p>Every lesson below is a simplified meaning, not a word-for-word hadith quote. The “Try it today” activity is an application, not an additional narration. Please review the Arabic, recordings and explanations with your Madrasa teacher before classroom release.</p>
        <div className={styles.sourceList}>{ITEMS.map((item: ClothingItem) => <details key={item.id}><summary>{item.english} · <span lang="ar" dir="rtl">{item.arabic}</span></summary><p>{item.lesson.note}</p><a href={item.lesson.url} target="_blank" rel="noopener noreferrer">{item.lesson.source} ↗</a><a href={item.vocabularySource} target="_blank" rel="noopener noreferrer">Vocabulary reference ↗</a></details>)}</div>
        <h3>Asset alignment</h3><p>The character and item images are loaded from your existing “child wearing” folder. Click regions use percentages of the complete child image; adjust the areas and label positions in content.ts after changing its crop. The child stays fully dressed. Separate item pictures are vocabulary clues, not clothing-removal layers.</p>
        <button type="button" className={styles.secondaryButton} onClick={() => dispatch({ type: "overlay", overlay: "reset" })}>Reset this level’s saved stars</button>
      </div>}
      {state.overlay === "reset" && <div className={styles.helpContent}><span className={styles.smallBadge}>START FRESH</span><h2 id="reset-title">Reset your word stars?</h2><p>This clears the six-word progress on this browser only. Your pictures and other projects will not change.</p><div className={styles.resetActions}><button type="button" className={styles.secondaryButton} onClick={closeModal}>Keep my stars</button><button type="button" className={styles.primaryButton} onClick={() => { stopAudio(); dispatch({ type: "reset" }); }}>Reset stars</button></div></div>}
    </Modal>
  </div>;
}
