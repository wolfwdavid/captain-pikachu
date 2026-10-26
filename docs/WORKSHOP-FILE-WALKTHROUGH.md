# Build with Agent NYC Event — Figma for Edu workshop kit

Saved 2026-10-20.

- Original Community file: https://www.figma.com/design/dyBek0uKfJFftk4yAvny0a/
- Editable copy (David White Wolf's team / Drafts): https://www.figma.com/design/qXeucLTDccvBHmQrRZ6EnQ/
- Local Figma file: `Build with Agent NYC Event (Community) (Copy).fig` (open with Figma desktop, or drag onto figma.com to import)
- Section screenshots: `screenshots/`

## What it is

Workshop kit for **"Building shaders with Figma agent NYC"**, a Figma for Edu monthly workshop
run by Miggi (Designer Advocate, Figma for Edu) and Joanna (Education + Community, Figma for Edu).
Students build an animated shader piece; results are projected at a Figma for Edu mixer at
ARTECHOUSE NYC (event name **"Afterimage"**). Includes a photo-booth 4x6 print template for the event.

Everything lives on one Figma page ("Page 1"), laid out as a slide deck on top and working areas below.

## Canvas layout

### 1. Title + intro (top-left)
- "Monthly Workshop" title cards — sage and blue background variants
- "Intro" — presenters with photos and socials (`screenshots/01-title.png`, `02-intro.png`)

### 2. Teaching deck (row of 1280x923 frames)
| Slide | Content |
|---|---|
| Figma Agent | Agent panel (sparkle icon, "Ask for changes") and a selected frame — `03-slide1.png` |
| Prompt | Example: "Make a kaleidoscope shader fill" — `04-prompt.png` |
| Shader fills + Shader effects | **Effect** = applied *to* an object to alter it (verb). **Fill** = fills a shape, a visual on its own (noun). — `05-effect-vs-fill.png` |
| Fill / Effect | Side-by-side example frames |
| Tools | Figma's built-in shaders: Moire, Bloom, Color adjust, Lens distortion, Shape-based particles, Pattern grid. "Find more in the Figma Community" — `06-slide-286.png` |
| Figma Motion | Shader properties can be animated on the Motion timeline; "Multiple animations" demo — `07-motion-timeline.png` |
| AI use | Building/editing shaders with the agent costs AI credits; using + animating them doesn't — `08-credits.png` |
| Current Limits | Shader resolution 2048x2048; Motion exports 3840x2160 — `09-resolution.png` |

### 3. Example galleries (middle band, 880x1008 frames)
- **Effects:** Pattern refraction, Halftone, Chromatic metal, Duotone, Glowing particles
- **Fills:** Moving gradient, Nebula, Caustic water, Concentric patterns
- **Custom:** Kaleidoscope ("Create a kaleidoscope shader"), Liquid neon, Neon after image
- **From image reference:** two reference photos and the shader each produced

### 4. "Motion piece" — the assignment (lower band)
1. **Ideate** — find a reference or write a description; decide effect vs fill — `13-step1.png`
2. **Prompt** — give the agent the reference/description plus any controls you want
3. **Refine** — answer the agent's questions, apply, iterate; ask for a **"phase" property** for clean looping in Motion
4. **Frame** — drop the shader into a supplied frame (many effects need content inside or a transparent background)
5. **Animate** — **15-second** animation; layer extra motion
6. **Preview** — put art frame + motion into the matching template under the **Attribution** layer; fill in name/school — `14-step-place.png`
7. **Export** — animation at **2x** -> **2160x3840** — `15-export.png`
8. **Submit your work!** — submission form + RSVP — `10-submission.png`

Templates below the slides: `Yourname-vertical` (1080x1920), `Yourname-horizontal` (1920x1080),
`Shader art-vertical`, Afterimage definition text, "Event Teaser" Instagram post (1080x1350), source images.

### 5. "Photo booth" (far right)
4x6 print template — `11-layer-breakdown.png`, `12-workspace.png`
- **Layer Breakdown:** total 1200x1800 (4"x6"), artwork area 975x1500 (3.25"x5"), photo 750x1125 (2.5"x3.75"), "Made in Figma by Student Name" credit strip
- **Your workspace:** components `student-name-background` and `student-name-foreground`, plus a finished example. Students decorate background + foreground; the photo sits between them.

Utility frames off to the side: `Spider`, `Export` (1920x1080), one empty 1280x720.

## Key node IDs (copy file)
- Page: `0:1`
- Title card: `9:667` · Intro: `1:1141`
- Figma Agent slide: `1:276` · Prompt: `1:308` · Fills+Effects: `1:282` · Tools: `1:286`
- Figma Motion: `1:292` · AI use: `1:303` · Current Limits: `1:297`
- Assignment slides: `1:808` `1:813` `1:818` `1:823` `1:828` `1:833` `1:839` · Submit: `1:844`
- Yourname-vertical: `1:853` · Yourname-horizontal: `1:856` · Shader art-vertical: `1:965`
- Event Teaser: `1:880` · Layer Breakdown: `2:420` · Your workspace: `2:682`
