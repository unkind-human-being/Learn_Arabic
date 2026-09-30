"use client";

import { useEffect, useRef, useState } from "react";
import { usePwa } from "./usePwa";
import styles from "./pwa.module.css";

export default function PwaExperience({ gameDialogOpen }: { gameDialogOpen: boolean }) {
  const pwa = usePwa();
  const [panel, setPanel] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [skipRotate, setSkipRotate] = useState(false);
  const infoRef = useRef<HTMLDialogElement>(null);
  const rotateRef = useRef<HTMLDialogElement>(null);
  const ready = pwa.phase === "ready";
  const loading = pwa.phase === "checking" || pwa.phase === "downloading";
  const label = pwa.updateReady ? "Update ready" : ready ? pwa.online ? "Offline ready" : "Playing offline" : loading ? "Saving offline…" : pwa.phase === "development" ? "Dev mode" : "Offline setup";
  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait) and (max-width: 1024px) and (any-pointer: coarse)");
    const change = () => setPortrait(media.matches);
    change(); media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const info = infoRef.current;
    const rotate = rotateRef.current;
    if (!info || !rotate) return;
    if (panel && !gameDialogOpen) { if (rotate.open) rotate.close(); if (!info.open) info.showModal(); }
    else {
      if (info.open) info.close();
      const showRotate = portrait && !skipRotate && !gameDialogOpen;
      if (showRotate && !rotate.open) rotate.showModal();
      if (!showRotate && rotate.open) rotate.close();
    }
    return () => { if (info.open) info.close(); if (rotate.open) rotate.close(); };
  }, [panel, portrait, skipRotate, gameDialogOpen]);
  const closeInfo = () => setPanel(false);
  return <>
    <button type="button" className={`${styles.statusButton} ${ready ? styles.ready : ""}`} onClick={() => setPanel(true)} aria-label={`Offline and install settings: ${label}`} data-testid="pwa-status">
      <span className={`${styles.statusDot} ${loading ? styles.loading : ""}`} aria-hidden="true"/><span>{label}</span>
    </button>
    {pwa.canFullscreen && <button type="button" className={styles.fullscreenButton} onClick={() => void pwa.enterFullscreen()} aria-label={pwa.fullscreen ? "Exit full screen" : "Play full screen"} title="Full screen · landscape recommended"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button>}
    <dialog ref={rotateRef} className={`${styles.dialog} ${styles.rotateDialog}`} aria-labelledby="rotate-title" onCancel={e => { e.preventDefault(); setSkipRotate(true); }}>
      <div className={styles.rotateArtwork} aria-hidden="true"><span className={styles.phoneShape}><span>أ ب ت</span></span><span className={styles.rotateArrow}>↻</span></div>
      <span className={styles.kicker}>A BIGGER LITTLE ADVENTURE</span>
      <h2 id="rotate-title">Turn your phone<br/>sideways to play</h2>
      <p>This game is best in <strong>landscape</strong>.<br/>See your friend and build your Arabic word side by side.</p>
      <div className={styles.landscapeBadge}>↔ LANDSCAPE RECOMMENDED</div>
      {pwa.canFullscreen && <button type="button" className={styles.primary} onClick={() => void pwa.enterFullscreen()}>Try full screen</button>}
      <button type="button" className={styles.quiet} onClick={() => setSkipRotate(true)}>Continue in portrait</button>
      <small>Turn off your phone’s rotation lock when needed. Your word will stay here.</small>
    </dialog>
    <dialog ref={infoRef} className={styles.dialog} aria-labelledby="pwa-title" onCancel={e => { e.preventDefault(); closeInfo(); }}>
      <button type="button" className={styles.close} aria-label="Close offline settings" onClick={closeInfo}>×</button>
      <span className={styles.kicker}>TAKE YOUR LITTLE CLASSROOM WITH YOU</span>
      <h2 id="pwa-title">Play anywhere</h2>
      <p>Save the whole level once, then play without an internet connection.</p>
      <div className={`${styles.downloadCard} ${ready ? styles.downloadReady : ""}`}>
        <strong>{ready ? "✓ Ready for offline play" : loading ? "Saving your game…" : "Offline setup needed"}</strong>
        <span>{ready ? "Pictures, all six words, and lesson text are saved on this device." : pwa.phase === "development" ? "Offline caching is disabled in development." : "Keep this page open and connected until it says Offline ready."}</span>
        {loading && <progress max={pwa.progress.total || 1} value={pwa.progress.count} aria-label="Offline download progress"/>}
        {pwa.progress.total > 0 && <small>{pwa.progress.count} / {pwa.progress.total} files · {pwa.online ? "Device reports online" : "Device reports offline"}</small>}
      </div>
      {pwa.notice && <p className={styles.notice} role="status">{pwa.notice}</p>}
      {pwa.updateReady && <div className={styles.updateCard}><strong>A new version is ready</strong><p>Your stars and word-in-progress are saved. Restart when you are ready—not in the middle of a lesson.</p><button type="button" className={styles.primary} onClick={pwa.applyUpdate}>Update & restart</button></div>}
      <h3>Add to your home screen</h3>
      {pwa.installed ? <p>✓ You are playing in the installed app.</p> : pwa.canInstall ? <><button type="button" className={styles.primary} disabled={!ready} onClick={() => void pwa.install()}>Install game</button>{!ready && <small>Installation unlocks after the offline download is complete.</small>}</> : pwa.ios ? <p>In Safari, open the <strong>Share</strong> menu, choose <strong>Add to Home Screen</strong>, enable <strong>Open as Web App</strong> when shown, then tap <strong>Add</strong>. Open the new icon online once and check for “Offline ready”.</p> : <p>Use your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, when offered. The in-page install button appears only in supported browsers.</p>}
      <h3>Landscape feels best</h3><p>Turn your device sideways. The child, letter tiles, and word builder stay beside each other. A portrait layout is available too.</p>
      <h3>Spoken audio</h3><p>{pwa.audioCount ? `${pwa.audioCount} recording file(s) are included in this download.` : "No teacher recordings are included in this download."} Device speech works only when a local voice is available. The pictures, word-building, rewards and written lessons do not need audio.</p>
      <h3>Keep your progress safe</h3><p>Stars and your current word stay in this browser or installed app. Clearing site data, private browsing, or device storage cleanup can remove them. External reference links still need the internet.</p>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={!pwa.online || pwa.phase === "development" || pwa.phase === "unsupported" || loading} onClick={() => void pwa.repair()}>Save / repair</button><button type="button" className={styles.secondary} disabled={!ready} onClick={() => void pwa.keepStorage()}>Keep offline files</button></div>
      <button type="button" className={styles.primary} onClick={closeInfo}>Back to the game</button>
    </dialog>
  </>;
}
