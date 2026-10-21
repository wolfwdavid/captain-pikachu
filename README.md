# Captain Pikachu

Interactive 360° toy of the Haneda (HND) pilot-uniform Pikachu plush. Built with Svelte + Vite.

**Live:** https://wolfwdavid.github.io/captain-pikachu/

![QR code](qr.png)

## How to play
- Starts as a still image. **Tap Pikachu to wake him** (on iPhone this also asks for motion permission).
- **Phone:** walk around / turn — the 360° scene pans with your compass heading and Pikachu turns with you:
  front → side → back (with the Pokéball clip and tail) → side → front. Tilt moves the view up/down.
- **Desktop:** mouse-look, drag to spin him, or ← / → keys.
- **Camera** button: uses your rear camera as the background so Pikachu stands in *your* room.
- **Selfie** button: front camera (mirrored) + a shutter. The photo is the live frame with Pikachu drawn on top
  and a small caption; on phones it opens the share sheet, elsewhere it downloads `captain-pikachu-selfie.png`.
- **Afterimage** toggle: cyan/magenta ghost trails that stretch with how fast he spins (the workshop's theme).
  Also baked into selfies when it's on.
- Tap Pikachu → salute · **poke his belly → he laughs** · `W` wave · `H` sparks · `L` laugh.
- **Voice:** "Pika" (synthesized in-browser), "Chirp" (Web Audio), **Record my pika** (3-second mic clip) or
  **Load sound** (pick any audio file from your device, e.g. a Pikachu clip you own). Recorded/loaded sounds stay
  in your browser's local storage only — nothing is uploaded and no copyrighted audio ships in this repo.
- Respects `prefers-reduced-motion`.

## Dev
```
npm install
npm run dev
npm run build   # also writes qr.png for the live URL
```
Artwork comes from `src/artwork.js`, generated from `../pikachu-pilot/gen-svg.js`
(front / side / back SVGs, single source shared with the Figma file).
Rig + state CSS lives in `src/rig.css` (global, because the SVGs are injected with `{@html}`).

Deploy: `npm run build`, copy `dist` to an orphan `gh-pages` branch and force-push.

Fan art for personal use — not affiliated with The Pokémon Company, ANA or Haneda Airport.
