# Captain Pikachu

Interactive 360° toy of the Haneda (HND) pilot-uniform Pikachu plush. Built with Svelte + Vite.

**Live:** https://wolfwdavid.github.io/captain-pikachu/

![QR code](qr.png)

## How to play
- Starts as a still image. **Tap Pikachu to wake him** (on iPhone this also asks for motion permission).
- **Phone:** turn around / tilt — the 360° scene pans with you and Pikachu turns to keep facing you (eyes follow too).
- **Desktop:** move the mouse or drag the scene to look around.
- Tap Pikachu → salute · **poke his belly → he laughs** · `W` wave · `H` sparks · `L` laugh.
- Synthesized chirp/giggle via Web Audio (no audio files). Sound toggle in the bar. Respects reduced-motion.

## Dev
```
npm install
npm run dev
npm run build   # also writes qr.png for the live URL
```
Artwork comes from `src/artwork.js`, generated from `../pikachu-pilot/gen-svg.js` (single source shared with the Figma file).

Fan art for personal use — not affiliated with The Pokémon Company, ANA or Haneda Airport.
