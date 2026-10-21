# Captain Pikachu — handoff (2026-10-20, 8:20 pm)

Everything needed to continue on another machine.

## Links
- Live toy: https://wolfwdavid.github.io/captain-pikachu/  (QR: `qr.png`)
- Repo: https://github.com/wolfwdavid/captain-pikachu  (`main` = source, `gh-pages` = deployed build)
- Figma (workshop copy, page "Captain Pikachu"): https://www.figma.com/design/qXeucLTDccvBHmQrRZ6EnQ
- Figma (design file: variants, prototype, motion): https://www.figma.com/design/kucBuqKefokrUQ1xoMRjRd
- Figma Make (older single-file toy): https://www.figma.com/make/iqh2GKvfWNhzzEpp0FxU49

## Set up on a new machine (≈3 min)
```
git clone https://github.com/wolfwdavid/captain-pikachu.git
cd captain-pikachu
npm install
npm run dev          # http://localhost:5173/captain-pikachu/
```
Requirements: Node 20+ (built with 24), `gh` CLI logged in as wolfwdavid for deploys.
Phone testing needs HTTPS → use the live URL, or `npx vite --host` + a tunnel.

## Deploy
```
npm run build                      # writes dist/ and qr.png
cp -r dist /tmp/pages && cd /tmp/pages && git init -b gh-pages && git add -A \
  && git commit -m "Deploy" && git push -f https://github.com/wolfwdavid/captain-pikachu.git gh-pages:gh-pages
```
GitHub Pages serves `gh-pages` at `/`. CDN picks it up in ~30–60 s.

## Where things are
| File | What |
|---|---|
| `src/App.svelte` | all behaviour: wake gate, tilt/compass + drag 360, 4-view turntable (`facePose`), belly-poke laugh, camera/selfie/shutter, afterimage FX, voice (speech / chirp / mic / loaded file), QR |
| `src/rig.css` | transform origins, idle loop, state rules (global because the SVGs are injected with `{@html}`) |
| `src/artwork.js` | generated — front/side/back SVG strings. Regenerate from `../pikachu-pilot/gen-svg.js` (not in this repo; see below) |
| `scripts/qr.mjs` | writes `qr.png` for the live URL |

Artwork source is now in `artwork/` (gen-svg.js + the three SVGs + TASKS.md). Original location on the first machine:
`C:\Users\Mkaru\Documents\Hello_World\hugginface_profile\workshops\build-with-agent-nyc\pikachu-pilot\`.
Run `node artwork/gen-svg.js` there (it writes next to itself), then paste the SVGs into `src/artwork.js`, or edit
`src/artwork.js` directly — it is plain SVG text.

## Interactions (for testing)
Tap to wake (iOS asks for motion) · turn around = 360 (front → side → back) · drag or ←/→ on desktop ·
tap = salute · poke belly = laugh · W wave · H sparks · L laugh · Camera / Selfie (+ shutter) ·
Afterimage toggle · Voice button cycles Pika / Chirp / Mine · Record my pika · Load sound · QR.

## Open items
- Untested on a real phone: tilt gains, iOS motion permission, camera/selfie share sheet. Tune `onTilt` gains and `facePose` width if needed.
- Pikachu voice clip from myinstants is copyrighted → not bundled; users load it locally via **Load sound**.
- Hugging Face Space deploy not done (needs `huggingface-cli login`, then upload `dist/` as a static Space).
- Possible polish: nicer side-view ear, thicker "edge" when exactly side-on, laugh pose on the back view.

## Figma notes
Interactions live on the State variants (Idle/Blink/Wave/Salute/Happy/Laugh + `belly-hotspot`); the Prototype
page has the flow start. Plugin-API gotchas hit today: GROUP children are frame-relative (rotate via absolute
transforms), SVG ellipses import as VECTOR, no double-click trigger (H key used), put click/key reactions on the
hover (Blink) variant too, Windows curl needs `cygpath -w` for Make uploads.
