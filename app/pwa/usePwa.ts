"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "checking" | "downloading" | "ready" | "error" | "unsupported" | "development";
type Status = { type: string; ready?: boolean; count?: number; total?: number; message?: string; version?: string; audioCount?: number };
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function usePwa() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [online, setOnline] = useState(true);
  const [progress, setProgress] = useState({ count: 0, total: 0 });
  const [notice, setNotice] = useState("");
  const [updateReady, setUpdateReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [ios, setIos] = useState(false);
  const [audioCount, setAudioCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const promptRef = useRef<InstallPrompt | null>(null);
  const reloadOnChange = useRef(false);
  const alive = useRef(false);

  const applyStatus = useCallback((data: Status) => {
    if (!alive.current) return;
    if (data.type === "PWA_STATUS") {
      setProgress({ count: data.count ?? 0, total: data.total ?? 0 });
      setAudioCount(data.audioCount ?? 0);
      setPhase(data.ready ? "ready" : "error");
      setNotice(data.ready ? "" : "Some offline files are missing. Reconnect, then tap Save / repair.");
    }
  }, []);
  const statusFrom = useCallback((worker: ServiceWorker | null | undefined, type = "PWA_STATUS") => {
    if (!worker) return;
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => {
      channel.port1.close();
      if (!alive.current) return;
      setPhase("error");
      setNotice("Offline setup took too long to reply. Reconnect, then tap Save / repair or reopen the game.");
    }, type === "PWA_REPAIR" ? 120000 : 12000);
    channel.port1.onmessage = (event: MessageEvent<Status>) => {
      window.clearTimeout(timer);
      channel.port1.close();
      if (!alive.current) return;
      if (event.data.type === "PWA_ERROR") { setPhase("error"); setNotice(event.data.message || "Connect to the internet and try again."); }
      else applyStatus(event.data);
    };
    worker.postMessage({ type }, [channel.port2]);
  }, [applyStatus]);

  useEffect(() => {
    alive.current = true;
    const refreshOnline = () => setOnline(navigator.onLine);
    const media = window.matchMedia("(display-mode: standalone)");
    const refreshInstalled = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const refreshFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    refreshOnline(); refreshInstalled(); refreshFullscreen();
    setCanFullscreen(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const installEvent = (event: Event) => { event.preventDefault(); promptRef.current = event as InstallPrompt; setCanInstall(true); };
    const installedEvent = () => { promptRef.current = null; setCanInstall(false); setInstalled(true); };
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);
    window.addEventListener("beforeinstallprompt", installEvent);
    window.addEventListener("appinstalled", installedEvent);
    media.addEventListener("change", refreshInstalled);
    document.addEventListener("fullscreenchange", refreshFullscreen);
    const cleanupBasic = () => {
      alive.current = false;
      window.removeEventListener("online", refreshOnline); window.removeEventListener("offline", refreshOnline);
      window.removeEventListener("beforeinstallprompt", installEvent); window.removeEventListener("appinstalled", installedEvent);
      media.removeEventListener("change", refreshInstalled); document.removeEventListener("fullscreenchange", refreshFullscreen);
    };
    if (process.env.NODE_ENV !== "production") {
      setPhase("development");
      setNotice("Offline caching is off during development. Run npm run build, then npm run start to test the PWA.");
      return cleanupBasic;
    }
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("caches" in window)) {
      setPhase("unsupported");
      setNotice("Offline saving needs HTTPS (or localhost on this computer) and a browser with service workers. The game still works online.");
      return cleanupBasic;
    }
    const onMessage = (event: MessageEvent<Status>) => {
      const data = event.data;
      if (!data?.type?.startsWith("PWA_")) return;
      // Never let a waiting update overwrite the active build's readiness badge.
      const isActive = event.source === navigator.serviceWorker.controller;
      if (data.type === "PWA_PROGRESS") {
        setPhase(p => p === "ready" ? p : "downloading");
        setProgress({ count: data.count ?? 0, total: data.total ?? 0 });
      } else if (data.type === "PWA_STATUS" && isActive) applyStatus(data);
      else if (data.type === "PWA_ERROR") {
        setPhase(p => p === "ready" ? p : "error");
        setNotice(data.message || "The download stopped. Reconnect and try again.");
      }
    };
    const onController = () => {
      if (reloadOnChange.current) { window.location.reload(); return; }
      statusFrom(navigator.serviceWorker.controller);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      statusFrom(navigator.serviceWorker.controller);
      if (navigator.onLine) void registration.current?.update().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    document.addEventListener("visibilitychange", onVisible);
    const watchInstalling = (reg: ServiceWorkerRegistration) => {
      const worker = reg.installing;
      if (!worker) return;
      const onState = () => {
        if (!alive.current) return;
        if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(Boolean(reg.waiting));
        if (worker.state === "activated") statusFrom(worker);
        if (worker.state === "redundant" && !reg.active) { setPhase("error"); setNotice("The offline download did not finish. Check the connection, then tap Save / repair."); }
      };
      worker.addEventListener("statechange", onState);
    };
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(reg => {
      if (!alive.current) return;
      registration.current = reg;
      if (reg.waiting) setUpdateReady(true);
      reg.addEventListener("updatefound", () => watchInstalling(reg));
      watchInstalling(reg);
      if (reg.active) statusFrom(reg.active);
      else setPhase("downloading");
    }).catch(() => {
      if (!alive.current) return;
      setPhase("error");
      setNotice("Could not prepare offline play. Check HTTPS, your connection, and that the production build generated /sw.js.");
    });
    return () => {
      cleanupBasic();
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyStatus, statusFrom]);

  async function repair() {
    if (!registration.current || !navigator.onLine) { setNotice("Connect to the internet, then reload the game to save the offline files."); return; }
    setNotice(""); setPhase("downloading");
    if (registration.current.active) statusFrom(registration.current.active, "PWA_REPAIR");
    else try { await registration.current.update(); } catch { setPhase("error"); setNotice("The download could not start. Reconnect and reload."); }
  }
  async function install() {
    const prompt = promptRef.current;
    if (!prompt || phase !== "ready") return;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setNotice(choice.outcome === "accepted" ? "Installation requested. Your browser will finish adding the game." : "No problem. You can still play in the browser.");
    } catch { setNotice("Use your browser menu to install this game."); }
    promptRef.current = null; setCanInstall(false);
  }
  async function enterFullscreen() {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (!document.documentElement.requestFullscreen) { setNotice("Turn your phone sideways. This browser does not offer full-screen mode."); return; }
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      try { await orientation?.lock?.("landscape"); } catch { /* A hint and responsive portrait fallback remain available. */ }
    } catch { setNotice("Full screen is unavailable here. Rotate your phone sideways to play in landscape."); }
  }
  async function keepStorage() {
    try {
      if (!navigator.storage?.persist) { setNotice("This browser manages storage automatically. Keep the game installed and avoid clearing its website data."); return; }
      const granted = await navigator.storage.persist();
      setNotice(granted ? "Persistent storage was granted. Clearing site data still removes your saved game." : "The browser did not grant persistent storage. Offline files may be removed when storage is low.");
    } catch { setNotice("Storage permission was unavailable. The current download can still be used while it remains on this device."); }
  }
  function applyUpdate() {
    if (!registration.current?.waiting) return;
    reloadOnChange.current = true;
    registration.current.waiting.postMessage({ type: "PWA_ACTIVATE" });
  }
  return { phase, online, progress, notice, updateReady, installed, canInstall, ios, audioCount, fullscreen, canFullscreen, repair, install, enterFullscreen, keepStorage, applyUpdate };
}
