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
- Tap Pikachu → salute · **poke his belly → he laughs** · `W` wave · `H` sparks · `L` laugh.
- **Voice:** "Pika" (synthesized in-browser, no copyrighted audio), "Chirp" (Web Audio), or **Record my pika**
  (3-second mic clip, saved in your browser) — cycle with the Voice button. Sound toggle.
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
