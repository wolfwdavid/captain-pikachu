<script>
  import { onMount } from "svelte";
  import { svg } from "./artwork.js";
  import QRCode from "qrcode";

  // ---- state -------------------------------------------------------------
  let awake = false;          // still image until the first touch / click
  let state = "";             // "", salute, wave, happy, laugh
  let soundOn = true;
  let showQr = false;
  let qrUrl = "";
  let tiltOk = false;         // device orientation available / permitted
  let hint = "Tap Pikachu to wake him up";

  // orientation / look targets (degrees)
  let yaw = 0, pitch = 0;     // where YOU are looking (360 scene)
  let tYaw = 0, tPitch = 0;
  let yaw0 = null;            // compass reference captured on first reading
  let figEl, sceneEl, svgEl, eyes = [];
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (d) => ((d + 540) % 360) - 180;

  // ---- audio (synthesized, no files) ------------------------------------
  let audio = null;
  function tone(f0, f1, t0, d, type = "square", vol = 0.09) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  function ensureAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (_) { audio = null; }
  }
  function chirp() { if (!soundOn || !audio) return; const t = audio.currentTime; tone(880, 1480, t, 0.11); tone(1180, 1960, t + 0.13, 0.17); }
  function giggle() {
    if (!soundOn || !audio) return; const t = audio.currentTime;
    [0, 0.14, 0.27, 0.42, 0.55].forEach((dt, i) => tone(700 + i * 90, 1300 + i * 120, t + dt, 0.1, "triangle", 0.11));
  }

  // ---- interactions -------------------------------------------------------
  let timer = 0;
  function setState(s, ms, sound) {
    state = ""; void svgEl?.getBoundingClientRect(); state = s;
    clearTimeout(timer); timer = setTimeout(() => (state = ""), ms);
    (sound || chirp)();
  }
  const salute = () => setState("salute", 900);
  const wave = () => setState("wave", 900);
  const happy = () => setState("happy", 1400);
  const laugh = () => setState("laugh", 1500, giggle);

  function toSvg(e) { const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svgEl.getScreenCTM().inverse()); }
  const inBelly = (p) => p.x > 400 && p.x < 624 && p.y > 640 && p.y < 870;

  async function wake() {
    if (awake) return;
    awake = true; ensureAudio(); hint = "Move your phone around — Pikachu follows you";
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const r = await DeviceOrientationEvent.requestPermission(); tiltOk = r === "granted";
      } else { tiltOk = "DeviceOrientationEvent" in window; }
    } catch (_) { tiltOk = false; }
    if (tiltOk) window.addEventListener("deviceorientation", onTilt, { passive: true });
    chirp();
  }

  function onPointerDown(e) {
    if (!awake) { wake(); return; }
    ensureAudio();
    const p = toSvg(e);
    if (inBelly(p)) laugh(); else salute();
  }

  // pointer look (desktop / no-tilt fallback) + pupils
  let pointerTarget = null;
  function onMove(e) {
    if (!awake || reduced) return;
    pointerTarget = toSvg(e);
    if (!tiltOk) {
      const r = sceneEl.getBoundingClientRect();
      tYaw = ((e.clientX - r.left) / r.width - 0.5) * 60;
      tPitch = ((e.clientY - r.top) / r.height - 0.5) * -30;
    }
  }
  // drag to look around the 360 scene (any device)
  let dragging = false, dragX = 0, dragYaw = 0;
  function dragStart(e) { if (!awake || inBelly(toSvg(e))) return; dragging = true; dragX = e.clientX; dragYaw = tYaw; }
  function dragMove(e) { if (!dragging) return; tYaw = dragYaw + (e.clientX - dragX) * 0.5; }
  function dragEnd() { dragging = false; }

  function onTilt(e) {
    if (e.alpha == null) return;
    if (yaw0 === null) yaw0 = e.alpha;
    // alpha: compass yaw (0-360). Turning around moves the scene; Pikachu keeps following you.
    tYaw = -wrap(e.alpha - yaw0) * 1.0;
    // beta: front/back tilt (90 = upright). gamma: left/right.
    tPitch = clamp(((e.beta ?? 90) - 60) * 0.5, -25, 25);
    const g = clamp(e.gamma ?? 0, -30, 30);
    tYaw += g * 0.6;
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!awake) return;
    yaw += (tYaw - yaw) * 0.08; pitch += (tPitch - pitch) * 0.08;
    // 360 scene: pan the panorama by yaw (wraps), tilt by pitch
    if (sceneEl) sceneEl.style.setProperty("--pan", `${-yaw * 3}px`);
    if (sceneEl) sceneEl.style.setProperty("--tilt", `${pitch * 2}px`);
    // Pikachu turns toward you (clamped) with a little depth parallax
    const fy = clamp(yaw * 0.45, -35, 35), fx = clamp(pitch * 0.4, -14, 14);
    if (figEl) figEl.style.transform = `perspective(1400px) rotateY(${fy}deg) rotateX(${fx}deg)`;
    const par = (k) => `translate(${-fy * k}px, ${fx * k}px)`;
    tail && (tail.style.transform = `${par(0.9)} rotate(${Math.sin(performance.now() / 500) * 7}deg)`);
    // pupils: follow pointer if any, otherwise follow the look direction
    for (const eye of eyes) {
      let dx, dy;
      if (pointerTarget && !tiltOk) { const vx = pointerTarget.x - eye.cx, vy = pointerTarget.y - eye.cy, d = Math.hypot(vx, vy) || 1, k = Math.min(1, d / 400); dx = (vx / d) * 7 * k; dy = (vy / d) * 7 * k; }
      else { dx = clamp(-fy / 35, -1, 1) * 7; dy = clamp(fx / 14, -1, 1) * 5; }
      eye.white.style.transform = `translate(${dx}px, ${dy}px)`;
      eye.shine.style.transform = `translate(${dx * 1.6}px, ${dy * 1.6}px)`;
    }
  }

  let tail;
  onMount(async () => {
    svgEl = document.getElementById("pikachu");
    tail = document.getElementById("tail");
    eyes = ["left", "right"].map((s) => ({ cx: s === "left" ? 440 : 584, cy: 438, white: document.getElementById(`eye-${s}-white`), shine: document.getElementById(`eye-${s}-shine`) }));
    // laughing mouth layers (hidden until .laugh)
    const mouth = document.getElementById("mouth");
    mouth.insertAdjacentHTML("beforeend",
      '<path id="mouth-laugh" fill="#5A1A1A" stroke="#111111" stroke-width="5" stroke-linejoin="round" d="M 468 498 C 494 494 530 494 556 498 C 552 532 530 548 512 548 C 494 548 472 532 468 498 Z"/>' +
      '<path id="mouth-tongue" fill="#E8453C" d="M 490 530 C 500 522 524 522 534 530 C 528 542 520 546 512 546 C 504 546 496 542 490 530 Z"/>');
    qrUrl = await QRCode.toDataURL(location.href.split("#")[0], { width: 360, margin: 1, color: { dark: "#1b1b1f", light: "#ffffff" } });
    requestAnimationFrame(frame);
    window.addEventListener("keydown", (e) => {
      if (!awake) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); salute(); }
      if (e.key.toLowerCase() === "w") wave();
      if (e.key.toLowerCase() === "h") happy();
      if (e.key.toLowerCase() === "l") laugh();
    });
  });
</script>

<main class:awake class:tilt={tiltOk}>
  <div class="scene" bind:this={sceneEl}
       on:pointermove={onMove} on:pointerdown={dragStart} on:pointerup={dragEnd} on:pointercancel={dragEnd} on:pointerleave={dragEnd}
       on:pointermove={dragMove}>
    <div class="sky"></div>
    <div class="clouds"></div>
    <div class="skyline"></div>
    <div class="runway"></div>

    <div class="figure {state}" bind:this={figEl}>
      <div class="stage" role="button" tabindex="0" aria-label="Pikachu. Tap to salute, poke the belly to make him laugh."
           on:pointerdown|stopPropagation={onPointerDown}>
        {@html svg}
      </div>
    </div>

    {#if !awake}
      <button class="wake" on:click={wake}>Tap to wake Captain Pikachu</button>
    {/if}
  </div>

  <header>
    <h1>Captain Pikachu</h1>
    <p>{hint}</p>
  </header>

  <div class="bar">
    <button on:click={() => { ensureAudio(); wave(); }}>Wave</button>
    <button on:click={() => { ensureAudio(); happy(); }}>Happy</button>
    <button on:click={() => { ensureAudio(); laugh(); }}>Laugh</button>
    <button on:click={() => (soundOn = !soundOn)} aria-pressed={soundOn}>Sound: {soundOn ? "on" : "off"}</button>
    <button on:click={() => (showQr = !showQr)} aria-pressed={showQr}>QR</button>
  </div>

  {#if showQr && qrUrl}
    <div class="qr" on:click={() => (showQr = false)} role="dialog" aria-label="QR code for this page">
      <img src={qrUrl} alt="QR code linking to this page" />
      <p>Scan to open on your phone</p>
    </div>
  {/if}
</main>

<style>
  :global(html, body) { margin: 0; height: 100%; background: #dfe9ff; overflow: hidden; }
  :global(*) { box-sizing: border-box; }
  main { font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #1b1b1f; height: 100dvh; width: 100vw; position: relative; overflow: hidden; touch-action: none; }

  /* ---- 360 scene (pans with --pan, wraps) ---- */
  .scene { position: absolute; inset: 0; overflow: hidden; perspective: 1400px; --pan: 0px; --tilt: 0px; }
  .sky { position: absolute; inset: -20% 0; background: linear-gradient(#bcd4ff 0%, #e8f0ff 55%, #fff4c2 100%); transform: translateY(var(--tilt)); }
  .clouds, .skyline, .runway { position: absolute; left: 0; right: 0; background-repeat: repeat-x; transform: translate3d(var(--pan), var(--tilt), 0); will-change: transform; }
  .clouds  { top: 6%; height: 30%; background-image: radial-gradient(circle at 20% 60%, #fff 0 60px, transparent 61px), radial-gradient(circle at 48% 40%, #fff 0 46px, transparent 47px), radial-gradient(circle at 75% 65%, #fff 0 70px, transparent 71px); background-size: 1080px 100%; opacity: .9; transform: translate3d(calc(var(--pan) * .4), calc(var(--tilt) * .6), 0); }
  .skyline { bottom: 24%; height: 22%; background-image: linear-gradient(transparent 0 45%, #a9b8d8 45%), linear-gradient(transparent 0 20%, #8ea1c9 20%), linear-gradient(transparent 0 60%, #b9c6e0 60%); background-size: 1080px 100%, 1080px 100%, 1080px 100%; background-position: 0 0, 300px 0, 700px 0; background-repeat: repeat-x; clip-path: polygon(0 60%, 6% 60%, 6% 30%, 12% 30%, 12% 55%, 20% 55%, 20% 10%, 24% 10%, 24% 50%, 34% 50%, 34% 35%, 42% 35%, 42% 62%, 50% 62%, 50% 20%, 56% 20%, 56% 58%, 66% 58%, 66% 40%, 72% 40%, 72% 65%, 80% 65%, 80% 28%, 86% 28%, 86% 55%, 94% 55%, 94% 45%, 100% 45%, 100% 100%, 0 100%); transform: translate3d(calc(var(--pan) * .7), var(--tilt), 0); }
  .runway { bottom: 0; height: 26%; background-image: linear-gradient(#5d6577, #3f4555), repeating-linear-gradient(90deg, transparent 0 120px, #f5f0d0 120px 220px); background-size: 100% 100%, 1080px 10px; background-position: 0 0, 0 55%; }

  /* ---- figure ---- */
  .figure { position: absolute; left: 50%; bottom: 8%; width: min(78vmin, 520px); aspect-ratio: 1; transform-style: preserve-3d; margin-left: calc(min(78vmin, 520px) / -2); transition: transform .12s linear; }
  .stage { width: 100%; height: 100%; cursor: pointer; outline: none; filter: drop-shadow(0 18px 24px rgba(20, 30, 60, .25)); }
  .stage:focus-visible { filter: drop-shadow(0 0 0 4px #1f2a5c); }
  :global(#pikachu) { width: 100%; height: 100%; overflow: visible; display: block; }

  .wake { position: absolute; left: 50%; bottom: 20%; transform: translateX(-50%); font: 600 16px/1 Inter, system-ui, sans-serif; padding: 16px 22px; border-radius: 999px; border: 0; background: #1b1b1f; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.25); cursor: pointer; animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { transform: translateX(-50%) scale(1) } 50% { transform: translateX(-50%) scale(1.05) } }

  header { position: absolute; top: max(12px, env(safe-area-inset-top)); left: 0; right: 0; text-align: center; pointer-events: none; }
  h1 { margin: 0; font-size: 22px; font-weight: 700; } p { margin: 4px 0 0; font-size: 14px; color: #4b4f5e; }
  .bar { position: absolute; bottom: max(12px, env(safe-area-inset-bottom)); left: 0; right: 0; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; padding: 0 12px; }
  .bar button { font: 500 14px Inter, system-ui, sans-serif; min-height: 44px; padding: 10px 16px; border-radius: 999px; cursor: pointer; border: 1.5px solid rgba(27,27,31,.18); background: rgba(255,255,255,.85); color: #1b1b1f; }
  .bar button:active { transform: scale(.97); } .bar button:focus-visible { outline: 3px solid #1f2a5c; outline-offset: 2px; }
  .qr { position: absolute; inset: 0; display: grid; place-content: center; gap: 10px; background: rgba(27,27,31,.6); backdrop-filter: blur(6px); text-align: center; color: #fff; }
  .qr img { width: min(70vw, 360px); border-radius: 16px; background: #fff; padding: 12px; }

  /* ---- rig: transform origins in SVG user units ---- */
  :global(#pikachu-root, #ear-left, #ear-right, #tail, #arm-right, #arm-left, #eye-left, #eye-right, #cheeks, #sparks, #head, #cap) { transform-box: view-box; }
  :global(#ear-left)  { transform-origin: 340px 350px; }
  :global(#ear-right) { transform-origin: 684px 350px; }
  :global(#tail)      { transform-origin: 640px 800px; }
  :global(#arm-right) { transform-origin: 612px 716px; transition: transform .28s cubic-bezier(.2,.9,.3,1.2); }
  :global(#arm-left)  { transform-origin: 412px 716px; transition: transform .28s cubic-bezier(.2,.9,.3,1.2); }
  :global(#eye-left)  { transform-origin: 440px 438px; }
  :global(#eye-right) { transform-origin: 584px 438px; }
  :global(#cheeks)    { transform-origin: 512px 522px; }
  :global(#eye-left-white, #eye-left-shine, #eye-right-white, #eye-right-shine) { transition: transform .12s ease-out, opacity .15s ease; }
  :global(#sparks) { transform-origin: 512px 480px; transform: scale(.4); opacity: 0; transition: transform .25s ease-out, opacity .25s ease-out; }
  :global(#eye-left-happy, #eye-right-happy, #mouth-laugh, #mouth-tongue, #mouth-smile) { opacity: 0; transition: opacity .15s ease; }
  :global(#mouth-smile) { opacity: 1; }

  /* ---- idle loop (only when awake) ---- */
  @keyframes bob   { 0%,100% { transform: translateY(0) }  50% { transform: translateY(-10px) } }
  @keyframes earL  { 0%,100% { transform: rotate(0) }      50% { transform: rotate(-4deg) } }
  @keyframes earR  { 0%,100% { transform: rotate(0) }      50% { transform: rotate(4deg) } }
  @keyframes blink { 0%,92%,100% { transform: scaleY(1) }  96% { transform: scaleY(.08) } }
  @keyframes shake { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-3deg) translateY(4px) } 75% { transform: rotate(3deg) translateY(4px) } }
  @keyframes cheekpop { 0% { transform: scale(1) } 40% { transform: scale(1.18) } 100% { transform: scale(1) } }
  main.awake :global(#pikachu-root) { animation: bob 3.2s ease-in-out infinite; }
  main.awake :global(#ear-left)  { animation: earL 3.2s ease-in-out infinite; }
  main.awake :global(#ear-right) { animation: earR 3.2s ease-in-out infinite; }
  main.awake :global(#eye-left), main.awake :global(#eye-right) { animation: blink 4.6s linear infinite; }

  /* ---- states ---- */
  .figure.salute :global(#arm-right) { transform: rotate(-100deg); }
  .figure.wave   :global(#arm-right) { transform: rotate(-45deg); }
  .figure.happy  :global(#sparks), .figure.laugh :global(#sparks) { transform: scale(1); opacity: 1; }
  .figure.happy  :global(#eye-left-happy), .figure.happy :global(#eye-right-happy),
  .figure.laugh  :global(#eye-left-happy), .figure.laugh :global(#eye-right-happy) { opacity: 1; }
  .figure.happy  :global(#eye-left-white), .figure.happy :global(#eye-right-white), .figure.happy :global(#eye-left-shine), .figure.happy :global(#eye-right-shine),
  .figure.laugh  :global(#eye-left-white), .figure.laugh :global(#eye-right-white), .figure.laugh :global(#eye-left-shine), .figure.laugh :global(#eye-right-shine) { opacity: 0; }
  .figure.happy  :global(#cheeks), .figure.laugh :global(#cheeks) { animation: cheekpop .5s ease-out; }
  .figure.laugh  :global(#mouth-smile) { opacity: 0; }
  .figure.laugh  :global(#mouth-laugh), .figure.laugh :global(#mouth-tongue) { opacity: 1; }
  .figure.laugh  :global(#pikachu-root) { animation: shake .22s ease-in-out 6; }
  .figure.laugh  :global(#arm-left)  { transform: rotate(35deg); }
  .figure.laugh  :global(#arm-right) { transform: rotate(-35deg); }

  @media (prefers-reduced-motion: reduce) {
    main.awake :global(#pikachu-root), main.awake :global(#ear-left), main.awake :global(#ear-right), main.awake :global(#eye-left), main.awake :global(#eye-right), .figure.laugh :global(#pikachu-root), .wake { animation: none; }
    .figure, :global(#arm-right), :global(#arm-left), :global(#sparks) { transition: none; }
  }
</style>
