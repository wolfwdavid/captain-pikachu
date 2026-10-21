<script>
  import { onMount } from "svelte";
  import { svg, svgBack, svgSide } from "./artwork.js";
  import QRCode from "qrcode";

  // ---- state -------------------------------------------------------------
  let awake = false;          // still image until the first touch / click
  let state = "";             // "", salute, wave, happy, laugh
  let soundOn = true;
  let voice = "pika";         // pika (speech) | chirp | mine (recorded)
  let showQr = false, qrUrl = "";
  let camera = false, cameraError = "";
  let tiltOk = false;
  let hint = "Tap Pikachu to wake him up";
  let recording = false, myPika = null;

  // look direction (degrees): yaw is a full 360 turntable, pitch is clamped
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, yaw0 = null;
  let figEl, sceneEl, svgEl, videoEl, eyes = [], tail;
  let faces = {};             // front / back / side / sideL elements
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (d) => ((d % 360) + 540) % 360 - 180;   // → (-180, 180]

  // ---- audio -------------------------------------------------------------
  let audio = null, stream = null, mediaRec = null;
  function ensureAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (_) { audio = null; }
  }
  function tone(f0, f1, t0, d, type = "square", vol = 0.09) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  function chirp() { if (!audio) return; const t = audio.currentTime; tone(880, 1480, t, 0.11); tone(1180, 1960, t + 0.13, 0.17); }
  function giggleTones() { if (!audio) return; const t = audio.currentTime; [0, 0.14, 0.27, 0.42, 0.55].forEach((dt, i) => tone(700 + i * 90, 1300 + i * 120, t + dt, 0.1, "triangle", 0.11)); }
  function speak(text, pitch = 2, rate = 1.3) {
    try {
      if (!("speechSynthesis" in window)) return false;
      const u = new SpeechSynthesisUtterance(text); u.pitch = pitch; u.rate = rate; u.volume = 1;
      const v = speechSynthesis.getVoices().find((x) => /en/i.test(x.lang) && /female|zira|samantha|karen|google us/i.test(x.name)) || speechSynthesis.getVoices().find((x) => /en/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
    } catch (_) { return false; }
  }
  function say(kind) {
    if (!soundOn) return;
    ensureAudio();
    if (voice === "mine" && myPika) { const a = new Audio(myPika); a.play().catch(() => {}); return; }
    if (voice === "pika") {
      const ok = kind === "laugh" ? speak("Pika pika pika! Hee hee hee!", 2, 1.5) : kind === "wave" ? speak("Pika!", 2, 1.4) : speak("Pika pika!", 2, 1.3);
      if (ok) return;
    }
    kind === "laugh" ? giggleTones() : chirp();
  }
  async function recordPika() {
    if (recording) { mediaRec?.stop(); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; mediaRec = new MediaRecorder(s);
      mediaRec.ondataavailable = (e) => chunks.push(e.data);
      mediaRec.onstop = () => { s.getTracks().forEach((t) => t.stop()); recording = false;
        const blob = new Blob(chunks, { type: mediaRec.mimeType || "audio/webm" });
        const r = new FileReader(); r.onload = () => { myPika = r.result; voice = "mine"; try { localStorage.setItem("myPika", myPika); } catch (_) {} say("salute"); }; r.readAsDataURL(blob); };
      mediaRec.start(); recording = true; hint = "Say “Pika pika!” — tap Stop when done";
      setTimeout(() => { if (recording) mediaRec.stop(); }, 3000);
    } catch (_) { hint = "Microphone not available"; }
  }

  // ---- camera background / selfie -------------------------------------------
  let facing = "environment";   // environment = room behind the phone, user = selfie
  let fx = false;               // afterimage ghost trails
  let ghost = 0;                // current ghost distance (px), driven by spin speed
  let lastYaw = 0, flash = false, shotUrl = "";
  async function startCamera(mode) {
    stream?.getTracks().forEach((t) => t.stop()); stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode }, width: { ideal: 1280 } }, audio: false });
      facing = mode; camera = true; cameraError = "";
      await tick0(); if (videoEl) { videoEl.srcObject = stream; await videoEl.play().catch(() => {}); }
      hint = mode === "user" ? "Smile — tap the shutter to take a selfie with Pikachu" : "Pikachu is in your room — walk around him";
    } catch (e) { cameraError = "Camera not available (allow camera access and use https)."; camera = false; }
  }
  function stopCamera() { stream?.getTracks().forEach((t) => t.stop()); stream = null; camera = false; hint = "Move your phone around — Pikachu follows you"; }
  const toggleCamera = () => (camera && facing === "environment" ? stopCamera() : startCamera("environment"));
  const toggleSelfie = () => (camera && facing === "user" ? stopCamera() : startCamera("user"));
  const tick0 = () => new Promise((r) => setTimeout(r, 0));

  // Shutter: video frame + the Pikachu drawing → PNG (share sheet on phones, download elsewhere)
  async function shutter() {
    if (!videoEl || !videoEl.videoWidth) return;
    flash = true; setTimeout(() => (flash = false), 180); say("salute");
    const W = videoEl.videoWidth, H = videoEl.videoHeight;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    if (facing === "user") { g.translate(W, 0); g.scale(-1, 1); }
    g.drawImage(videoEl, 0, 0, W, H);
    g.setTransform(1, 0, 0, 1, 0, 0);
    // where the figure sits on screen → same place in the video frame (object-fit: cover)
    const sr = sceneEl.getBoundingClientRect(), fr = figEl.getBoundingClientRect();
    const s = Math.max(sr.width / W, sr.height / H), ox = (sr.width - W * s) / 2, oy = (sr.height - H * s) / 2;
    const x = (fr.left - sr.left - ox) / s, y = (fr.top - sr.top - oy) / s, w = fr.width / s, h = fr.height / s;
    const visible = ["front", "side", "back", "sideL"].map((k) => faces[k]).filter((el) => el && parseFloat(el.style.opacity || "0") > 0.5)[0] || faces.front;
    const svgText = new XMLSerializer().serializeToString(visible.querySelector("svg"));
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText); });
    if (fx) { g.globalAlpha = 0.55; g.drawImage(img, x - w * 0.035, y, w, h); g.globalCompositeOperation = "screen"; g.drawImage(img, x + w * 0.035, y, w, h); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
    g.drawImage(img, x, y, w, h);
    g.font = `${Math.round(W * 0.035)}px Inter, system-ui, sans-serif`; g.fillStyle = "rgba(255,255,255,.9)"; g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 4;
    g.strokeText("Captain Pikachu ✈ HND", W * 0.04, H * 0.96); g.fillText("Captain Pikachu ✈ HND", W * 0.04, H * 0.96);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    shotUrl = URL.createObjectURL(blob);
    const file = new File([blob], "captain-pikachu-selfie.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Captain Pikachu" }); return; } catch (_) {} }
    const a = document.createElement("a"); a.href = shotUrl; a.download = "captain-pikachu-selfie.png"; a.click();
  }

  // Load any sound file from the phone (kept in this browser only — never uploaded)
  let fileEl;
  function loadSoundFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { myPika = r.result; voice = "mine"; try { localStorage.setItem("myPika", myPika); } catch (_) {} hint = `Voice: ${f.name}`; say("salute"); };
    r.readAsDataURL(f);
  }

  // ---- interactions -------------------------------------------------------
  let timer = 0;
  function setState(s, ms) { state = ""; void svgEl?.getBoundingClientRect(); state = s; clearTimeout(timer); timer = setTimeout(() => (state = ""), ms); say(s); }
  const salute = () => setState("salute", 900);
  const wave = () => setState("wave", 900);
  const happy = () => setState("happy", 1400);
  const laugh = () => setState("laugh", 1600);

  function toSvg(e) { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svgEl.getScreenCTM().inverse()); }
  const inBelly = (p) => p.x > 400 && p.x < 624 && p.y > 640 && p.y < 870;

  async function wake() {
    if (awake) return;
    awake = true; ensureAudio(); hint = "Move your phone around — Pikachu follows you";
    let allowed = "DeviceOrientationEvent" in window;
    try { if (allowed && typeof DeviceOrientationEvent.requestPermission === "function") allowed = (await DeviceOrientationEvent.requestPermission()) === "granted"; } catch (_) { allowed = false; }
    if (allowed) window.addEventListener("deviceorientation", onTilt, { passive: true });
    try { speechSynthesis?.getVoices(); } catch (_) {}
    say("salute");
  }
  function onPointerDown(e) {
    if (!awake) { wake(); return; }
    ensureAudio();
    const p = toSvg(e);
    if (inBelly(p)) laugh(); else salute();
  }

  // pointer look (desktop) + pupils
  let pointerTarget = null;
  function onMove(e) {
    if (!awake || reduced) return;
    pointerTarget = toSvg(e);
    if (!tiltOk && !dragging) { const r = sceneEl.getBoundingClientRect(); tYaw = ((e.clientX - r.left) / r.width - 0.5) * 70; tPitch = ((e.clientY - r.top) / r.height - 0.5) * -30; }
  }
  // drag anywhere to spin him around (full 360)
  let dragging = false, dragX = 0, dragYaw = 0;
  function dragStart(e) { if (!awake) return; dragging = true; dragX = e.clientX; dragYaw = tYaw; }
  function dragMove(e) { if (!dragging) return; tYaw = dragYaw + (e.clientX - dragX) * 0.6; }
  function dragEnd() { dragging = false; }

  function onTilt(e) {
    if (e.alpha == null && e.beta == null && e.gamma == null) return;
    if (!tiltOk) { tiltOk = true; hint = "Turn around — the scene and Pikachu follow you"; }
    tPitch = clamp(((e.beta ?? 90) - 60) * 0.5, -25, 25);
    if (e.alpha == null) { tYaw = clamp(e.gamma ?? 0, -30, 30) * 0.6; return; }
    if (yaw0 === null) yaw0 = e.alpha;
    // compass heading → full turntable: walk around him and you see his sides and back
    tYaw = -wrap(e.alpha - yaw0) + clamp(e.gamma ?? 0, -30, 30) * 0.4;
  }

  // Four drawings on a turntable. Each one is squashed by cos(angle) like a card turning,
  // and only the two nearest the viewer are visible, so the hand-off reads as a real rotation.
  function facePose(a, center) {
    const d = wrap(a - center), ad = Math.abs(d);
    const sx = Math.max(0.06, Math.cos((d * Math.PI) / 180));
    const opacity = ad < 45 ? 1 : clamp((90 - ad) / 45, 0, 1);
    return { sx, opacity, d };
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!awake) return;
    const dy = wrap(tYaw - yaw); yaw = wrap(yaw + dy * 0.08); pitch += (tPitch - pitch) * 0.08;
    // afterimage: ghost distance follows how fast he is spinning, then fades
    const speed = Math.abs(wrap(yaw - lastYaw)); lastYaw = yaw;
    ghost += ((fx ? 4 + Math.min(28, speed * 6) : 0) - ghost) * 0.15;
    figEl?.style.setProperty("--ghost", `${ghost.toFixed(1)}px`);
    sceneEl?.style.setProperty("--pan", `${-yaw * 3}px`);
    sceneEl?.style.setProperty("--tilt", `${pitch * 2}px`);
    // which drawing shows depends on the angle; each one also leans a little for depth
    const rx = clamp(pitch * 0.4, -14, 14);   // up/down lean (NOT the afterimage toggle `fx`)
    for (const [k, c] of [["front", 0], ["side", 90], ["back", 180], ["sideL", -90]]) {
      const el = faces[k]; if (!el) continue;
      const { sx, opacity, d } = facePose(yaw, c);
      el.style.opacity = opacity; el.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      el.style.zIndex = String(Math.round(opacity * 10));
      el.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${d * 0.15}deg) scaleX(${k === "sideL" ? -sx : sx})`;
    }
    if (tail) tail.style.transform = `rotate(${Math.sin(now / 500) * 7}deg)`;
    const fy = clamp(wrap(yaw) * 0.5, -40, 40);
    for (const eye of eyes) {
      let ex, ey;
      if (pointerTarget && !tiltOk) { const vx = pointerTarget.x - eye.cx, vy = pointerTarget.y - eye.cy, d = Math.hypot(vx, vy) || 1, k = Math.min(1, d / 400); ex = (vx / d) * 7 * k; ey = (vy / d) * 7 * k; }
      else { ex = clamp(-fy / 40, -1, 1) * 7; ey = clamp(rx / 14, -1, 1) * 5; }
      eye.white.style.transform = `translate(${ex}px, ${ey}px)`;
      eye.shine.style.transform = `translate(${ex * 1.6}px, ${ey * 1.6}px)`;
    }
  }

  onMount(async () => {
    svgEl = document.getElementById("pikachu");
    tail = document.getElementById("tail");
    faces = { front: document.getElementById("face-front"), side: document.getElementById("face-side"), back: document.getElementById("face-back"), sideL: document.getElementById("face-sideL") };
    eyes = ["left", "right"].map((s) => ({ cx: s === "left" ? 440 : 584, cy: 438, white: document.getElementById(`eye-${s}-white`), shine: document.getElementById(`eye-${s}-shine`) }));
    document.getElementById("mouth").insertAdjacentHTML("beforeend",
      '<path id="mouth-laugh" fill="#5A1A1A" stroke="#111111" stroke-width="5" stroke-linejoin="round" d="M 468 498 C 494 494 530 494 556 498 C 552 532 530 548 512 548 C 494 548 472 532 468 498 Z"/>' +
      '<path id="mouth-tongue" fill="#E8453C" d="M 490 530 C 500 522 524 522 534 530 C 528 542 520 546 512 546 C 504 546 496 542 490 530 Z"/>');
    try { myPika = localStorage.getItem("myPika"); if (myPika) voice = "mine"; } catch (_) {}
    qrUrl = await QRCode.toDataURL(location.href.split("#")[0].split("?")[0], { width: 360, margin: 1, color: { dark: "#1b1b1f", light: "#ffffff" } });
    requestAnimationFrame(frame);
    window.addEventListener("keydown", (e) => {
      if (!awake) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); salute(); }
      const k = e.key.toLowerCase();
      if (k === "w") wave(); if (k === "h") happy(); if (k === "l") laugh();
      if (e.key === "ArrowLeft") tYaw -= 20; if (e.key === "ArrowRight") tYaw += 20;
    });
  });
</script>

<main class:awake class:tilt={tiltOk} class:camera>
  <div class="scene" bind:this={sceneEl}
       on:pointermove={onMove} on:pointermove={dragMove}
       on:pointerdown={dragStart} on:pointerup={dragEnd} on:pointercancel={dragEnd} on:pointerleave={dragEnd}>
    {#if camera}
      <video class="cam" class:mirror={facing === "user"} bind:this={videoEl} autoplay muted playsinline></video>
    {:else}
      <div class="sky"></div><div class="clouds"></div><div class="skyline"></div><div class="runway"></div>
    {/if}

    <div class="figure {state}" class:fx bind:this={figEl}>
      <div class="stage" role="button" tabindex="0" aria-label="Pikachu. Tap to salute, poke the belly to make him laugh, drag to spin him around."
           on:pointerdown|stopPropagation={onPointerDown}>
        <div class="face" id="face-front">{@html svg}</div>
        <div class="face" id="face-side">{@html svgSide}</div>
        <div class="face" id="face-back">{@html svgBack}</div>
        <div class="face" id="face-sideL">{@html svgSide}</div>
      </div>
    </div>

    {#if !awake}
      <button class="wake" on:click={wake}>Tap to wake Captain Pikachu</button>
    {/if}
    {#if camera}
      <button class="shutter" on:click|stopPropagation={shutter} aria-label="Take photo"></button>
    {/if}
    {#if flash}<div class="flash"></div>{/if}
  </div>

  <header><h1>Captain Pikachu</h1><p>{hint}</p>{#if cameraError}<p class="err">{cameraError}</p>{/if}</header>

  <div class="bar">
    <button on:click={() => { ensureAudio(); wave(); }}>Wave</button>
    <button on:click={() => { ensureAudio(); happy(); }}>Happy</button>
    <button on:click={() => { ensureAudio(); laugh(); }}>Laugh</button>
    <button on:click={toggleCamera} aria-pressed={camera && facing === "environment"}>{camera && facing === "environment" ? "Scene" : "Camera"}</button>
    <button on:click={toggleSelfie} aria-pressed={camera && facing === "user"}>{camera && facing === "user" ? "Scene" : "Selfie"}</button>
    <button on:click={() => (fx = !fx)} aria-pressed={fx}>Afterimage: {fx ? "on" : "off"}</button>
    <button on:click={() => fileEl.click()}>Load sound</button>
    <input type="file" accept="audio/*" bind:this={fileEl} on:change={loadSoundFile} hidden />
    <button on:click={() => (soundOn = !soundOn)} aria-pressed={soundOn}>Sound: {soundOn ? "on" : "off"}</button>
    <button on:click={() => (voice = voice === "pika" ? "chirp" : voice === "chirp" ? (myPika ? "mine" : "pika") : "pika")}>Voice: {voice === "pika" ? "Pika" : voice === "chirp" ? "Chirp" : "Mine"}</button>
    <button on:click={recordPika}>{recording ? "Stop" : "Record my pika"}</button>
    <button on:click={() => (showQr = !showQr)} aria-pressed={showQr}>QR</button>
  </div>

  {#if showQr && qrUrl}
    <div class="qr" on:click={() => (showQr = false)} role="dialog" aria-label="QR code for this page">
      <img src={qrUrl} alt="QR code linking to this page" /><p>Scan to open on your phone</p>
    </div>
  {/if}
</main>

<style>
  :global(html, body) { margin: 0; height: 100%; background: #dfe9ff; overflow: hidden; }
  :global(*) { box-sizing: border-box; }
  main { font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1b1b1f; height: 100dvh; width: 100vw; position: relative; overflow: hidden; touch-action: none; }
  main.camera { background: #000; color: #fff; }

  .scene { position: absolute; inset: 0; overflow: hidden; --pan: 0px; --tilt: 0px; }
  .cam { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cam.mirror { transform: scaleX(-1); }
  .shutter { position: absolute; left: 50%; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 64px); transform: translateX(-50%); width: 72px; height: 72px; border-radius: 50%; border: 5px solid #fff; background: rgba(255,255,255,.35); box-shadow: 0 0 0 3px rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.4); cursor: pointer; }
  .shutter:active { transform: translateX(-50%) scale(.92); }
  .flash { position: absolute; inset: 0; background: #fff; animation: flash .18s ease-out forwards; pointer-events: none; }
  @keyframes flash { from { opacity: .9 } to { opacity: 0 } }
  /* afterimage: a cyan ghost trails one way, a magenta ghost the other, distance = spin speed */
  .figure { --ghost: 0px; }
  .figure.fx .stage { filter: drop-shadow(calc(var(--ghost) * -1) 0 0 rgba(25, 211, 230, .75)) drop-shadow(var(--ghost) 0 0 rgba(255, 46, 184, .75)) drop-shadow(0 18px 24px rgba(20, 30, 60, .3)); }
  .sky { position: absolute; inset: -20% 0; background: linear-gradient(#bcd4ff 0%, #e8f0ff 55%, #fff4c2 100%); transform: translateY(var(--tilt)); }
  .clouds, .skyline, .runway { position: absolute; left: 0; right: 0; background-repeat: repeat-x; transform: translate3d(var(--pan), var(--tilt), 0); will-change: transform; }
  .clouds  { top: 6%; height: 30%; background-image: radial-gradient(circle at 20% 60%, #fff 0 60px, transparent 61px), radial-gradient(circle at 48% 40%, #fff 0 46px, transparent 47px), radial-gradient(circle at 75% 65%, #fff 0 70px, transparent 71px); background-size: 1080px 100%; opacity: .9; transform: translate3d(calc(var(--pan) * .4), calc(var(--tilt) * .6), 0); }
  .skyline { bottom: 24%; height: 22%; background-image: linear-gradient(transparent 0 45%, #a9b8d8 45%), linear-gradient(transparent 0 20%, #8ea1c9 20%), linear-gradient(transparent 0 60%, #b9c6e0 60%); background-size: 1080px 100%, 1080px 100%, 1080px 100%; background-position: 0 0, 300px 0, 700px 0; clip-path: polygon(0 60%, 6% 60%, 6% 30%, 12% 30%, 12% 55%, 20% 55%, 20% 10%, 24% 10%, 24% 50%, 34% 50%, 34% 35%, 42% 35%, 42% 62%, 50% 62%, 50% 20%, 56% 20%, 56% 58%, 66% 58%, 66% 40%, 72% 40%, 72% 65%, 80% 65%, 80% 28%, 86% 28%, 86% 55%, 94% 55%, 94% 45%, 100% 45%, 100% 100%, 0 100%); transform: translate3d(calc(var(--pan) * .7), var(--tilt), 0); }
  .runway { bottom: 0; height: 26%; background-image: linear-gradient(#5d6577, #3f4555), repeating-linear-gradient(90deg, transparent 0 120px, #f5f0d0 120px 220px); background-size: 100% 100%, 1080px 10px; background-position: 0 0, 0 55%; }

  .figure { position: absolute; left: 50%; bottom: 8%; width: min(78vmin, 520px); aspect-ratio: 1; margin-left: calc(min(78vmin, 520px) / -2); }
  .stage { position: relative; width: 100%; height: 100%; cursor: grab; outline: none; filter: drop-shadow(0 18px 24px rgba(20, 30, 60, .3)); }
  .stage:focus-visible { filter: drop-shadow(0 0 0 4px #1f2a5c); }
  .face { position: absolute; inset: 0; transition: transform .12s linear; will-change: transform, opacity; }
  :global(.face svg) { width: 100%; height: 100%; overflow: visible; display: block; }

  .wake { position: absolute; left: 50%; bottom: 22%; transform: translateX(-50%); font: 600 16px/1 Inter, system-ui, sans-serif; padding: 16px 22px; border-radius: 999px; border: 0; background: #1b1b1f; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.25); cursor: pointer; animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { transform: translateX(-50%) scale(1) } 50% { transform: translateX(-50%) scale(1.05) } }

  header { position: absolute; top: max(12px, env(safe-area-inset-top)); left: 0; right: 0; text-align: center; pointer-events: none; text-shadow: 0 1px 8px rgba(255,255,255,.6); }
  main.camera header { text-shadow: 0 1px 8px rgba(0,0,0,.8); }
  h1 { margin: 0; font-size: 22px; font-weight: 700; } p { margin: 4px 0 0; font-size: 14px; color: inherit; opacity: .8; } .err { color: #ffb4b4; }
  .bar { position: absolute; bottom: max(12px, env(safe-area-inset-bottom)); left: 0; right: 0; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; padding: 0 10px; }
  .bar button { font: 500 13px Inter, system-ui, sans-serif; min-height: 44px; padding: 8px 14px; border-radius: 999px; cursor: pointer; border: 1.5px solid rgba(27,27,31,.18); background: rgba(255,255,255,.88); color: #1b1b1f; }
  .bar button:active { transform: scale(.97); } .bar button:focus-visible { outline: 3px solid #1f2a5c; outline-offset: 2px; }
  .qr { position: absolute; inset: 0; display: grid; place-content: center; gap: 10px; background: rgba(27,27,31,.6); backdrop-filter: blur(6px); text-align: center; color: #fff; }
  .qr img { width: min(70vw, 360px); border-radius: 16px; background: #fff; padding: 12px; }

</style>
