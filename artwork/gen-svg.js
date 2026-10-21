// Generates pikachu-pilot.svg. Run: node gen-svg.js
// Every part is a <g id> so Figma's SVG import names the layers.
const fs = require("fs");
const path = require("path");

const W = 1024;
const mx = (x) => W - x; // mirror across the vertical centre line

// --- cubic bezier helpers -------------------------------------------------
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
// de Casteljau split of cubic [p0,p1,p2,p3] at t -> [left, right]
function split(p0, p1, p2, p3, t) {
  const p01 = lerp(p0, p1, t), p12 = lerp(p1, p2, t), p23 = lerp(p2, p3, t);
  const p012 = lerp(p01, p12, t), p123 = lerp(p12, p23, t);
  const m = lerp(p012, p123, t);
  return [[p0, p01, p012, m], [m, p123, p23, p3]];
}
const C = (c) => `C ${f(c[1])} ${f(c[2])} ${f(c[3])}`;
const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

// --- ear: a leaf from base B1 -> tip T -> base B2, black tip = top `s` of the leaf
function ear(id, mirror) {
  const M = mirror ? (p) => ({ x: mx(p.x), y: p.y }) : (p) => p;
  const B1 = M({ x: 332, y: 362 }), c1 = M({ x: 272, y: 290 }), c2 = M({ x: 228, y: 170 }), T = M({ x: 214, y: 40 });
  const c3 = M({ x: 300, y: 112 }), c4 = M({ x: 406, y: 206 }), B2 = M({ x: 456, y: 300 });
  const s = 0.38;
  const [aLow, aTip] = split(B1, c1, c2, T, 1 - s); // edge A: base -> tip
  const [bTip, bLow] = split(T, c3, c4, B2, s);     // edge B: tip -> base
  const fur = `M ${f(B1)} ${C(aLow)} ${C(aTip)} ${C(bTip)} ${C(bLow)} Z`;
  const tip = `M ${f(aTip[0])} ${C(aTip)} ${C(bTip)} Z`;
  return `
  <g id="${id}">
    <path id="${id}-fur" fill="#F7D44C" d="${fur}"/>
    <path id="${id}-tip" fill="#1B1B1F" d="${tip}"/>
  </g>`;
}

function arm(id, mirror) {
  const X = mirror ? mx : (x) => x;
  const paw = `M ${X(296)} 716 C ${X(296)} 692 ${X(314)} 678 ${X(340)} 678 L ${X(400)} 686 L ${X(400)} 748 L ${X(340)} 754 C ${X(314)} 754 ${X(296)} 740 ${X(296)} 716 Z`;
  const sleeve = `M ${X(392)} 684 L ${X(442)} 684 L ${X(442)} 752 L ${X(392)} 752 C ${X(380)} 752 ${X(372)} 740 ${X(372)} 718 C ${X(372)} 696 ${X(380)} 684 ${X(392)} 684 Z`;
  return `
  <g id="${id}">
    <path id="${id}-paw" fill="#F7D44C" d="${paw}"/>
    <path id="${id}-sleeve" fill="#F6F3EC" d="${sleeve}"/>
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
  <g id="tail">
    <path id="tail-bolt" fill="#F2C73A" stroke="#D9A62A" stroke-width="4" stroke-linejoin="round" d="M 640 800 L 720 720 L 686 708 L 790 560 L 766 660 L 812 646 L 712 830 Z"/>
    <path id="tail-base" fill="#8B5A2B" d="M 612 816 L 650 786 L 680 826 L 648 848 Z"/>
  </g>
${ear("ear-left", false)}
${ear("ear-right", true)}
  <g id="trousers">
    <path id="trousers-shape" fill="#1B1B1F" d="M 398 780 L 626 780 L 626 868 C 626 904 598 920 560 920 L 464 920 C 426 920 398 904 398 868 Z"/>
  </g>
  <g id="feet">
    <ellipse id="foot-left" cx="452" cy="912" rx="52" ry="28" fill="#1B1B1F"/>
    <ellipse id="foot-right" cx="572" cy="912" rx="52" ry="28" fill="#1B1B1F"/>
  </g>
  <g id="shirt">
    <path id="shirt-body" fill="#F6F3EC" d="M 392 626 C 392 606 410 596 432 596 L 592 596 C 614 596 632 606 632 626 L 632 790 L 392 790 Z"/>
    <rect id="shirt-pocket" x="424" y="690" width="44" height="30" rx="4" fill="none" stroke="#D9D4C7" stroke-width="3"/>
  </g>
${arm("arm-left", false)}
${arm("arm-right", true)}
  <g id="tie">
    <path id="tie-body" fill="#1F2A5C" d="M 494 640 L 530 640 L 524 788 L 512 804 L 500 788 Z"/>
    <path id="tie-knot" fill="#1F2A5C" d="M 496 616 L 528 616 L 532 642 L 492 642 Z"/>
  </g>
  <g id="collar">
    <path id="collar-left" fill="#FFFFFF" stroke="#D9D4C7" stroke-width="2.5" stroke-linejoin="round" d="M 440 596 L 512 616 L 486 650 L 448 630 Z"/>
    <path id="collar-right" fill="#FFFFFF" stroke="#D9D4C7" stroke-width="2.5" stroke-linejoin="round" d="M 584 596 L 512 616 L 538 650 L 576 630 Z"/>
  </g>
  <g id="patch">
    <path id="patch-shield" fill="#1B1B1F" d="M 556 708 L 636 708 L 632 760 C 630 772 622 778 596 778 C 570 778 562 772 560 760 Z"/>
    <path id="patch-wing-left" fill="#C9A227" d="M 562 722 L 584 718 L 586 736 L 566 740 Z"/>
    <path id="patch-wing-right" fill="#C9A227" d="M 630 722 L 608 718 L 606 736 L 626 740 Z"/>
    <circle id="patch-ball-top" cx="596" cy="727" r="9" fill="#E53935"/>
    <path id="patch-ball-bottom" fill="#FFFFFF" d="M 587 727 A 9 9 0 0 0 605 727 Z"/>
    <circle id="patch-ball-center" cx="596" cy="727" r="3" fill="#FFFFFF" stroke="#1B1B1F" stroke-width="1.5"/>
  </g>
  <g id="head">
    <path id="head-shape" fill="#F7D44C" d="M 282 440 C 282 300 380 228 512 228 C 644 228 742 300 742 440 C 742 562 650 644 512 644 C 374 644 282 562 282 440 Z"/>
  </g>
  <g id="cheeks">
    <ellipse id="cheek-left" cx="362" cy="522" rx="44" ry="40" fill="#E8453C"/>
    <ellipse id="cheek-right" cx="662" cy="522" rx="44" ry="40" fill="#E8453C"/>
  </g>
  <g id="eyes">
    <g id="eye-left">
      <ellipse id="eye-left-white" cx="440" cy="438" rx="38" ry="44" fill="#111111"/>
      <circle id="eye-left-shine" cx="428" cy="424" r="13" fill="#FFFFFF"/>
      <path id="eye-left-happy" fill="#111111" opacity="0" d="M 410 457 C 410 435 424 427 440 427 C 456 427 470 435 470 457 L 459 457 C 459 444 450 438 440 438 C 430 438 421 444 421 457 Z"/>
    </g>
    <g id="eye-right">
      <ellipse id="eye-right-white" cx="584" cy="438" rx="38" ry="44" fill="#111111"/>
      <circle id="eye-right-shine" cx="572" cy="424" r="13" fill="#FFFFFF"/>
      <path id="eye-right-happy" fill="#111111" opacity="0" d="M 554 457 C 554 435 568 427 584 427 C 600 427 614 435 614 457 L 603 457 C 603 444 594 438 584 438 C 574 438 565 444 565 457 Z"/>
    </g>
  </g>
  <g id="nose">
    <ellipse id="nose-dot" cx="512" cy="474" rx="8" ry="5" fill="#111111"/>
  </g>
  <g id="mouth">
    <path id="mouth-smile" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M 464 500 Q 488 534 512 506 Q 536 534 560 500"/>
  </g>
  <g id="cap">
    <path id="cap-crown" fill="#1B1B1F" d="M 336 306 C 326 176 420 128 512 128 C 604 128 698 176 688 306 Z"/>
    <path id="cap-band" fill="#C9A227" d="M 334 298 L 690 298 L 690 310 L 334 310 Z"/>
    <ellipse id="cap-visor" cx="512" cy="322" rx="184" ry="24" fill="#111111"/>
    <path id="cap-visor-shine" fill="#2E2E34" d="M 350 318 C 420 300 604 300 674 318 C 604 310 420 310 350 318 Z"/>
    <path id="cap-braid-left" fill="none" stroke="#C9A227" stroke-width="3" stroke-linecap="round" d="M 436 328 Q 460 318 484 328"/>
    <path id="cap-braid-right" fill="none" stroke="#C9A227" stroke-width="3" stroke-linecap="round" d="M 540 328 Q 564 318 588 328"/>
    <g id="cap-badge">
      <path id="badge-wing-left" fill="#C9A227" d="M 426 210 L 472 196 L 476 228 L 434 236 Z"/>
      <path id="badge-wing-right" fill="#C9A227" d="M 598 210 L 552 196 L 548 228 L 590 236 Z"/>
      <circle id="badge-ball-top" cx="512" cy="212" r="32" fill="#E53935"/>
      <path id="badge-ball-bottom" fill="#FFFFFF" d="M 480 212 A 32 32 0 0 0 544 212 Z"/>
      <rect id="badge-ball-band" x="480" y="208" width="64" height="8" fill="#1B1B1F"/>
      <circle id="badge-ball-center" cx="512" cy="212" r="9" fill="#FFFFFF" stroke="#1B1B1F" stroke-width="4"/>
    </g>
  </g>
  <g id="sparks">
    <path id="spark-left-1" fill="#FFE97A" d="M 300 440 L 308 462 L 330 470 L 308 478 L 300 500 L 292 478 L 270 470 L 292 462 Z"/>
    <path id="spark-left-2" fill="#FFE97A" d="M 252 500 L 257 514 L 271 519 L 257 524 L 252 538 L 247 524 L 233 519 L 247 514 Z"/>
    <path id="spark-right-1" fill="#FFE97A" d="M 724 440 L 732 462 L 754 470 L 732 478 L 724 500 L 716 478 L 694 470 L 716 462 Z"/>
    <path id="spark-right-2" fill="#FFE97A" d="M 772 500 L 777 514 L 791 519 L 777 524 L 772 538 L 767 524 L 753 519 L 767 514 Z"/>
  </g>
</svg>
`;

const out = path.join(__dirname, "pikachu-pilot.svg");
fs.writeFileSync(out, svg);
console.log(`wrote ${out} (${svg.length} bytes)`);

// --- BACK view (what you see after turning him 180°) -------------------------
const svgBack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
  <g id="b-clip">
    <circle id="b-clip-ring" cx="512" cy="112" r="46" fill="none" stroke="#FFFFFF" stroke-width="14"/>
    <circle id="b-clip-ring-shade" cx="512" cy="112" r="46" fill="none" stroke="#D8D8DC" stroke-width="4"/>
    <path id="b-clip-strap" fill="#FFFFFF" d="M 500 150 L 524 150 L 530 200 L 494 200 Z"/>
  </g>
${ear("b-ear-left", false)}
${ear("b-ear-right", true)}
  <g id="b-trousers"><path fill="#1B1B1F" d="M 386 770 L 638 770 L 638 868 C 638 910 606 926 560 926 L 464 926 C 418 926 386 910 386 868 Z"/></g>
  <g id="b-feet"><ellipse cx="448" cy="916" rx="54" ry="28" fill="#1B1B1F"/><ellipse cx="576" cy="916" rx="54" ry="28" fill="#1B1B1F"/></g>
  <g id="b-shirt">
    <path fill="#F6F3EC" d="M 392 626 C 392 606 410 596 432 596 L 592 596 C 614 596 632 606 632 626 L 632 790 L 392 790 Z"/>
    <path id="b-collar" fill="#FFFFFF" stroke="#D9D4C7" stroke-width="2.5" d="M 436 596 L 588 596 L 580 624 L 444 624 Z"/>
    <path id="b-seam" fill="none" stroke="#E6E1D6" stroke-width="3" d="M 512 624 L 512 790"/>
  </g>
  <g id="b-arm-left">
    <path fill="#F7D44C" stroke="#D9A62A" stroke-width="4" d="M 296 716 C 296 692 314 678 340 678 L 400 686 L 400 748 L 340 754 C 314 754 296 740 296 716 Z"/>
    <path fill="#F6F3EC" d="M 392 684 L 442 684 L 442 752 L 392 752 C 380 752 372 740 372 718 C 372 696 380 684 392 684 Z"/>
  </g>
  <g id="b-arm-right">
    <path fill="#F7D44C" stroke="#D9A62A" stroke-width="4" d="M 728 716 C 728 692 710 678 684 678 L 624 686 L 624 748 L 684 754 C 710 754 728 740 728 716 Z"/>
    <path fill="#F6F3EC" d="M 632 684 L 582 684 L 582 752 L 632 752 C 644 752 652 740 652 718 C 652 696 644 684 632 684 Z"/>
  </g>
  <g id="b-tail">
    <path id="b-tail-bolt" fill="#F2C73A" stroke="#D9A62A" stroke-width="4" stroke-linejoin="round" d="M 500 790 L 590 706 L 556 694 L 664 548 L 640 648 L 686 634 L 580 816 Z"/>
    <ellipse id="b-tail-base" cx="520" cy="796" rx="58" ry="42" fill="#8B5A2B"/>
  </g>
  <g id="b-head"><path fill="#F7D44C" d="M 282 440 C 282 300 380 228 512 228 C 644 228 742 300 742 440 C 742 562 650 644 512 644 C 374 644 282 562 282 440 Z"/></g>
  <g id="b-cap">
    <path fill="#1B1B1F" d="M 336 306 C 326 176 420 128 512 128 C 604 128 698 176 688 306 Z"/>
    <path fill="#C9A227" d="M 334 298 L 690 298 L 690 310 L 334 310 Z"/>
    <path fill="#2E2E34" d="M 512 134 C 520 190 520 250 512 304 C 504 250 504 190 512 134 Z"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(__dirname, "pikachu-pilot-back.svg"), svgBack);
console.log("wrote pikachu-pilot-back.svg");

// --- SIDE view (facing right; mirrored in CSS for the left side) --------------
const svgSide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
  <g id="s-tail">
    <path fill="#F2C73A" stroke="#D9A62A" stroke-width="4" stroke-linejoin="round" d="M 420 790 L 340 700 L 376 690 L 262 540 L 292 646 L 244 632 L 350 820 Z"/>
    <path fill="#8B5A2B" d="M 400 800 L 436 770 L 470 810 L 436 836 Z"/>
  </g>
  <g id="s-ear">
    <path fill="#F7D44C" d="M 470 350 C 440 300 418 220 426 90 C 500 150 560 220 586 300 Z"/>
    <path fill="#1B1B1F" d="M 426 90 C 428 130 436 165 450 198 C 486 180 512 160 536 140 C 505 118 468 100 426 90 Z"/>
  </g>
  <g id="s-trousers"><path fill="#1B1B1F" d="M 410 780 L 620 780 L 620 868 C 620 904 594 920 556 920 L 474 920 C 436 920 410 904 410 868 Z"/></g>
  <g id="s-feet"><ellipse cx="560" cy="912" rx="64" ry="28" fill="#1B1B1F"/><ellipse cx="470" cy="914" rx="46" ry="24" fill="#121216"/></g>
  <g id="s-shirt"><path fill="#F6F3EC" d="M 404 626 C 404 606 420 596 440 596 L 600 596 C 620 596 636 606 636 626 L 636 790 L 404 790 Z"/><path fill="#FFFFFF" stroke="#D9D4C7" stroke-width="2.5" d="M 560 596 L 622 596 L 606 640 L 560 626 Z"/></g>
  <g id="s-arm">
    <path fill="#F7D44C" stroke="#D9A62A" stroke-width="4" d="M 700 716 C 700 692 684 678 660 678 L 600 686 L 600 748 L 660 754 C 684 754 700 740 700 716 Z"/>
    <path fill="#F6F3EC" d="M 612 684 L 560 684 L 560 752 L 612 752 C 624 752 632 740 632 718 C 632 696 624 684 612 684 Z"/>
  </g>
  <g id="s-head"><path fill="#F7D44C" d="M 330 440 C 330 300 410 228 512 228 C 630 228 720 300 720 440 C 720 562 636 644 512 644 C 400 644 330 562 330 440 Z"/></g>
  <g id="s-cheek"><ellipse cx="652" cy="524" rx="40" ry="38" fill="#E8453C"/></g>
  <g id="s-eye"><ellipse cx="610" cy="438" rx="30" ry="44" fill="#111111"/><circle cx="602" cy="424" r="11" fill="#FFFFFF"/></g>
  <g id="s-nose"><ellipse cx="712" cy="474" rx="7" ry="5" fill="#111111"/></g>
  <g id="s-mouth"><path fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" d="M 664 504 Q 690 530 714 502"/></g>
  <g id="s-cap">
    <path fill="#1B1B1F" d="M 360 306 C 350 176 440 128 530 128 C 620 128 700 176 696 306 Z"/>
    <path fill="#C9A227" d="M 356 298 L 700 298 L 700 310 L 356 310 Z"/>
    <path fill="#111111" d="M 560 300 L 770 306 C 790 320 786 340 760 346 L 560 346 Z"/>
    <path fill="#C9A227" d="M 582 192 L 620 186 L 626 212 L 588 220 Z"/>
    <circle cx="650" cy="206" r="22" fill="#E53935"/><path fill="#FFFFFF" d="M 628 206 A 22 22 0 0 0 672 206 Z"/><circle cx="650" cy="206" r="6" fill="#FFFFFF" stroke="#1B1B1F" stroke-width="3"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(__dirname, "pikachu-pilot-side.svg"), svgSide);
console.log("wrote pikachu-pilot-side.svg");

// --- web toy: same artwork, inline, with CSS/JS interactivity ---------------
const inlineSvg = svg
  .replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">',
           '<svg id="pikachu" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Captain Pikachu, a Pikachu plush in a Haneda pilot uniform"><g id="pikachu-root">')
  .replace("</svg>", "</g></svg>");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Captain Pikachu</title>
<style>
  :root { --bg-a: #dfe9ff; --bg-b: #fff4c2; --ink: #1b1b1f; --muted: #5f6270; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink);
    background: radial-gradient(120% 90% at 50% 10%, var(--bg-b), var(--bg-a) 70%);
    display: grid; place-items: center; overflow: hidden; touch-action: manipulation;
  }
  main { display: grid; justify-items: center; gap: 12px; padding: 24px 16px; width: min(92vw, 560px); }
  .stage { width: 100%; aspect-ratio: 1; cursor: pointer; outline: none; border-radius: 24px; }
  .stage:focus-visible { box-shadow: 0 0 0 4px #1f2a5c; }
  #pikachu { width: 100%; height: 100%; overflow: visible; display: block; }
  h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  p  { margin: 0; color: var(--muted); font-size: 14px; text-align: center; }
  .bar { display: flex; gap: 8px; }
  button {
    font: inherit; font-size: 14px; padding: 10px 16px; min-height: 44px; border-radius: 999px; cursor: pointer;
    border: 1.5px solid rgba(27,27,31,.18); background: rgba(255,255,255,.75); color: var(--ink);
    transition: transform .15s ease, background .15s ease;
  }
  button:hover { background: #fff; } button:active { transform: scale(.97); }
  button:focus-visible { outline: 3px solid #1f2a5c; outline-offset: 2px; }

  /* ---- rig: transform origins in SVG user units ---- */
  #pikachu-root, #ear-left, #ear-right, #tail, #arm-right, #arm-left, #eye-left, #eye-right, #cheeks, #sparks, #head, #cap
    { transform-box: view-box; }
  #ear-left  { transform-origin: 340px 350px; }
  #ear-right { transform-origin: 684px 350px; }
  #tail      { transform-origin: 640px 800px; }
  #arm-right { transform-origin: 612px 716px; transition: transform .28s cubic-bezier(.2,.9,.3,1.2); }
  #arm-left  { transform-origin: 412px 716px; }
  #eye-left  { transform-origin: 440px 438px; }
  #eye-right { transform-origin: 584px 438px; }
  #eye-left-white, #eye-left-shine, #eye-right-white, #eye-right-shine { transition: transform .12s ease-out; }
  #sparks    { transform-origin: 512px 480px; transform: scale(.4); opacity: 0; transition: transform .25s ease-out, opacity .25s ease-out; }
  #eye-left-happy, #eye-right-happy, #eye-left-white, #eye-right-white, #eye-left-shine, #eye-right-shine { transition: opacity .15s ease; }

  /* ---- idle loop ---- */
  @keyframes bob   { 0%,100% { transform: translateY(0) }  50% { transform: translateY(-10px) } }
  @keyframes earL  { 0%,100% { transform: rotate(0) }      50% { transform: rotate(-4deg) } }
  @keyframes earR  { 0%,100% { transform: rotate(0) }      50% { transform: rotate(4deg) } }
  @keyframes wag   { 0%,100% { transform: rotate(0) }      50% { transform: rotate(9deg) } }
  @keyframes blink { 0%,92%,100% { transform: scaleY(1) }  96% { transform: scaleY(.08) } }
  #pikachu-root { animation: bob 3.2s ease-in-out infinite; }
  #ear-left  { animation: earL 3.2s ease-in-out infinite; }
  #ear-right { animation: earR 3.2s ease-in-out infinite; }
  #tail      { animation: wag 2.4s ease-in-out infinite; }
  #eye-left, #eye-right { animation: blink 4.6s linear infinite; }

  /* ---- states ---- */
  .salute #arm-right { transform: rotate(-100deg); }
  .wave   #arm-right { transform: rotate(-45deg); }
  .happy  #sparks { transform: scale(1); opacity: 1; }
  .happy  #eye-left-happy, .happy #eye-right-happy { opacity: 1 !important; }
  .happy  #eye-left-white, .happy #eye-right-white, .happy #eye-left-shine, .happy #eye-right-shine { opacity: 0; }
  .happy  #cheeks { animation: cheekpop .5s ease-out; }
  @keyframes cheekpop { 0% { transform: scale(1) } 40% { transform: scale(1.18) } 100% { transform: scale(1) } }
  #cheeks { transform-origin: 512px 522px; }

  @media (prefers-reduced-motion: reduce) {
    #pikachu-root, #ear-left, #ear-right, #tail, #eye-left, #eye-right, .happy #cheeks { animation: none; }
    #arm-right, #sparks, #eye-left-white, #eye-left-shine, #eye-right-white, #eye-right-shine { transition: none; }
  }
</style>
</head>
<body>
<main>
  <h1>Captain Pikachu</h1>
  <p>Move your cursor and Pikachu follows. Click or press Space to salute.</p>
  <div class="stage" id="stage" tabindex="0" role="button" aria-label="Pikachu. Click to salute.">
${inlineSvg}
  </div>
  <div class="bar">
    <button type="button" id="btn-wave">Wave</button>
    <button type="button" id="btn-happy">Happy</button>
    <button type="button" id="btn-sound" aria-pressed="true">Sound: on</button>
  </div>
</main>
<script>
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = document.getElementById("pikachu");
  const stage = document.getElementById("stage");
  const eyes = ["left", "right"].map(side => ({
    cx: side === "left" ? 440 : 584, cy: 438,
    white: document.getElementById(\`eye-\${side}-white\`),
    shine: document.getElementById(\`eye-\${side}-shine\`),
  }));

  // --- pupils follow the pointer (SVG user units) ---
  let raf = 0, target = null;
  function toSvg(e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function look() {
    raf = 0;
    for (const eye of eyes) {
      let dx = 0, dy = 0;
      if (target) {
        const vx = target.x - eye.cx, vy = target.y - eye.cy, d = Math.hypot(vx, vy) || 1;
        const k = Math.min(1, d / 400);
        dx = (vx / d) * 7 * k; dy = (vy / d) * 7 * k;
      }
      eye.white.style.transform = \`translate(\${dx}px, \${dy}px)\`;
      eye.shine.style.transform = \`translate(\${dx * 1.6}px, \${dy * 1.6}px)\`;
    }
  }
  function onMove(e) { if (reduced) return; target = toSvg(e); if (!raf) raf = requestAnimationFrame(look); }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", () => { target = null; look(); });

  // --- synthesized chirp (no external audio) ---
  let audio = null, soundOn = true;
  function chirp() {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t = audio.currentTime;
      const note = (f0, f1, t0, d) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + d);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + d + 0.02);
      };
      note(880, 1480, t, 0.11);        // "pi"
      note(1180, 1960, t + 0.13, 0.17); // "ka"
    } catch (_) { /* audio unavailable */ }
  }

  // --- state helpers ---
  let timer = 0;
  function setState(cls, ms) {
    svg.classList.remove("salute", "wave", "happy");
    void svg.getBoundingClientRect(); // restart cheek pop animation
    svg.classList.add(cls);
    clearTimeout(timer);
    timer = setTimeout(() => svg.classList.remove(cls), ms);
    chirp();
  }
  stage.addEventListener("click", () => setState("salute", 900));
  stage.addEventListener("dblclick", () => setState("happy", 1400));
  stage.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); setState("salute", 900); }
    if (e.key.toLowerCase() === "w") setState("wave", 900);
    if (e.key.toLowerCase() === "h") setState("happy", 1400);
  });
  document.getElementById("btn-wave").addEventListener("click", () => setState("wave", 900));
  document.getElementById("btn-happy").addEventListener("click", () => setState("happy", 1400));
  const snd = document.getElementById("btn-sound");
  snd.addEventListener("click", () => {
    soundOn = !soundOn; snd.textContent = soundOn ? "Sound: on" : "Sound: off"; snd.setAttribute("aria-pressed", String(soundOn));
  });
})();
</script>
</body>
</html>
`;
const htmlOut = path.join(__dirname, "index.html");
fs.writeFileSync(htmlOut, html);
console.log(`wrote ${htmlOut} (${html.length} bytes)`);
