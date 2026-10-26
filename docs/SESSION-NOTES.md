# Build with Agent NYC — session notes (2026-10-20, Figma for Edu workshop)

Master record of everything made that evening. A copy lives in the repo at `docs/SESSION-NOTES.md`.

## 1. Deliverables and where they live

| What | Link / path |
|---|---|
| **Captain Pikachu live toy** (Svelte) | https://wolfwdavid.github.io/captain-pikachu/ |
| Repo (source `main`, deploy `gh-pages`) | https://github.com/wolfwdavid/captain-pikachu — latest `2c57625` |
| QR code for the live link | repo `qr.png`; in-app **QR** button; placed in the workshop Figma file |
| Handoff for another machine | repo `HANDOFF.md` |
| Figma — workshop file copy, page **"Captain Pikachu"** | https://www.figma.com/design/qXeucLTDccvBHmQrRZ6EnQ (set `4008:926`, prototype `4008:943`, QR `4010:713`, Back `4012:785`, Side `4012:786`) |
| Figma — design file "Pilot Pikachu — Interactive" | https://www.figma.com/design/kucBuqKefokrUQ1xoMRjRd (set `3:368`, Prototype `9:10`, Motion `10:3`, Back `24:2`, Side `24:3`) |
| Figma Make (first single-file toy) | https://www.figma.com/make/iqh2GKvfWNhzzEpp0FxU49 |
| Local source — app | `…\build-with-agent-nyc\captain-pikachu\` |
| Local source — artwork generator | `…\build-with-agent-nyc\pikachu-pilot\gen-svg.js` (also in repo `artwork/`) |
| Workshop file walkthrough | `…\build-with-agent-nyc\README.md` + `screenshots\` (15 PNGs of the Figma deck) |
| Task log + review | `…\build-with-agent-nyc\pikachu-pilot\tasks\todo.md` (copy: repo `artwork/TASKS.md`) |
| Photos / video used | `C:\Users\Mkaru\Downloads\IMG_9867/9868/9872/9873/9874.jpeg`, `IMG_9875.mov` (`IMG_9867 (1)` is a duplicate) |

## 2. What was built, in order
1. Walked through the workshop Figma file (duplicated the Community file into Drafts: `qXeucLTDccvBHmQrRZ6EnQ`).
2. Started an "Afterimage node-portfolio" design plan — **dropped** when the user pivoted (plan file kept at `~/.claude/plans/fuzzy-inventing-yeti.md`).
3. Pilot Pikachu drawn as flat vector SVG (generator script), imported into Figma, built into a 6-state variant set
   (Idle · Blink · Wave · Salute · Happy · Laugh) with prototype interactions and a 4 s Motion idle loop (verified by video export).
4. Same Pikachu rebuilt inside the workshop file so it can be shown there; QR + link placed beside it.
5. Svelte web toy, deployed to GitHub Pages with QR:
   still image until tap → tilt/compass or drag 360° turntable (front/side/back drawings, card-turn crossfade) →
   belly poke = laugh → camera background → selfie with shutter (share/download) → afterimage ghost trails →
   voice: synthesized "Pika pika!", chirp, mic recording, or a loaded local audio file.

## 3. Decisions worth remembering
- **No copyrighted audio shipped.** The myinstants Pikachu clip is the official voice; users load it on-device via **Load sound** instead.
- **Fan art, personal use** — nothing presented as official Pokémon / ANA / HND material.
- **Hugging Face not used for hosting**: MCP is read-only and no token on the machine. To do later: `huggingface-cli login`, upload `dist/` as a static Space.
- **Figma has no double-click trigger** → `H` key for Happy; click/key reactions must also live on the hover (Blink) variant.
- Reference video for the "360 motion" was Bad Bunny's 360° visualizer → implemented as look-around scene + turntable.

## 4. Technical gotchas (so they aren't re-learned)
- Figma Plugin API: GROUP children are frame-relative — rotate via absolute transforms, never a group's `relativeTransform`.
  SVG `<ellipse>` imports as VECTOR (no `arcData`). Raised limbs must be re-ordered above the head. Reactions set via `setReactionsAsync`.
- Windows + Git Bash: `curl` needs `cygpath -w` for `/tmp` paths (Figma Make upload).
- Svelte 4: `:global(a, b)` is rejected → rig/animation CSS moved to global `src/rig.css`.
- A local `const fx` inside `frame()` shadowed the `fx` toggle → TDZ ReferenceError every frame. Renamed to `rx`.
- GitHub Pages: pushing `dist/` to an orphan `gh-pages` branch auto-enables Pages; CDN lags ~30–60 s (poll for the new bundle hash).
- Desktop Chrome exposes `DeviceOrientationEvent` but never fires it → enable tilt only after the first real reading.

## 5. Open items
- Untested on a real phone: tilt/compass gains, iOS motion permission prompt, camera/selfie share sheet.
- Workshop `.fig` "Save local copy" never produced a download (file is safe in Drafts).
- Optional polish: side-view ear, laugh pose on the back view, Figma shader hero, HF Space.

## 6. Session housekeeping
- Local preview servers (ports 8765/4173/4175/4176) were stopped; one was auto-stopped by Claude Code for low system memory — nothing to fix.
- Chrome tabs left open: the live toy and the Figma prototype.
