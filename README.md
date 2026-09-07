# Jen-Wei Kuo Portfolio

Static GitHub Pages portfolio for Jen-Wei (Wayne) Kuo, covering AI/ML, edge AI, computer vision, wireless DRL, and embedded systems.

Live site: https://kwannn666.github.io/

## Structure

```text
.
|-- index.html                  # Content, diagrams, and project cards
|-- styles.css                  # Responsive styling
|-- script.js                   # Accessible tabs, filters, navigation, theme, and motion
|-- theme-init.js               # Applies the saved/system theme before first paint
|-- thesis-scene.js             # Thesis model geometry, entity descriptions and link definitions
|-- systems3d.js                # Native WebGL renderer, signals, interaction and page motion
|-- 404.html
|-- robots.txt
|-- sitemap.xml
`-- assets/
    |-- JenWei_Kuo_Resume.pdf   # Current downloadable CV
    |-- favicon.svg
    `-- images/
        |-- profile.jpg         # Original retained for sharing and fallback
        |-- profile-360.webp    # Responsive portrait variants
        |-- profile-720.webp
        |-- project10-480.webp  # Responsive vessel photo variants
        |-- project10-960.webp
        |-- dual-uav-ris-swipt.jpg  # User-supplied research architecture figure
        `-- project1.jpg ... project10.jpg
```

## Portfolio Content

- Lead identity: Kaggle Competitions Expert, with a profile link, global top 1% positioning, and rank/medal figures explicitly presented as a supplied profile snapshot rather than live data.
- Section order follows the supplied CV, with the requested standalone thesis: About, Education, Master's Thesis, Competitions & Awards, Publication, Selected Projects, Edge AI demo details, Toolkit, Relevant Coursework, and Contact.
- The thesis has its own navigation entry, architecture figure on the left, research summary on the right, and three method stages. It is no longer part of the general project grid.
- Projects start with the unmanned vessel and AIDSP deployment suite, followed by medical vision, multi-task/efficient models, RAG, accident prediction, control, and competition work.
- AIDSP Edge AI Suite: four Jetson-targeted demos with CSS architecture diagrams and repository links.
- Dedicated research: dual-UAV RIS-assisted SWIPT. Projects: ESG verification, CVPR children gait analysis, medical segmentation, embedded vessel, lightweight vision, RAG, and control systems.
- Publication and competition records: CVPR CV4CHL, Kaggle, and AI CUP results.

## Project Image Mapping

Keep every visual image paired with the project it documents:

- `project1`: Brain Tumor MRI Segmentation
- `project3`: Unified-OneHead Multi-Task Learning
- `project4`: DynamicConv
- `project5`: TinyViT
- `project7`: AI Mock-Interview Platform
- `project8`: Traffic Accident Prediction
- `project9`: Two-Wheel Balance Car with LQR
- `project10`: Intelligent Unmanned Vessel
- `dual-uav-ris-swipt`: Dual-UAV RIS-Assisted SWIPT Networks (the supplied architecture diagram)

The AIDSP, ESG, and CVPR cards use HTML/CSS architecture diagrams. Project images link to their full-size originals and preserve the entire diagram in the thumbnail.

### Content notes

- Education dates, project roles, coursework, language skills, and additional competition results follow the supplied CV. The original downloadable PDF remains unchanged.
- The supplied CV lists two different TAISC field sizes (134 in awards, 130 in the project entry). The website uses the consistent 12th-place result without a denominator.
- The Kaggle rank snapshot is 1,296 of 212,639, highest rank 1,260, with one silver and one bronze competition medal. These numbers come from the supplied profile screenshot and are not auto-refreshed.

## Interaction and accessibility

- All projects and all four AIDSP demos are readable without JavaScript. Interactive controls appear after initialization.
- AIDSP tabs support Left/Right arrows, Home, End, and a single tab stop.
- Category and keyword search can be combined; matching checks all words and announces the result count. Clear filters restores all projects.
- The mobile menu closes on Escape, outside clicks, navigation, and focus leaving the menu.
- Themes follow the operating system until the visitor explicitly selects one. Storage failures do not block the page.
- Decorative animation pauses outside the hero, when the document is hidden, on mobile, and when reduced motion is requested.
- The native WebGL hero depicts the thesis architecture: an access point, two UAVs with suspended RIS panel grids, six user terminals, and two fixed service regions. Each UAV follows its own smooth patrol loop (16 and 20 seconds), with its complete rotor footprint contained in its assigned region. RIS panels, labels, dashed links and signal particles follow the aircraft. The trajectories and region boundary are illustrative, not simulation output.
- Three buildings between the AP and user regions obstruct all six direct AP–user paths while leaving the elevated AP–RIS paths clear throughout both patrols. A static coral path stops at the building facade with a cross; only the eight AP–RIS/RIS–user links carry signal particles. The selectable building label explains the assumed absence of a direct link; the illustration is not a radio-propagation simulation.
- Pointer dragging/arrow keys rotate the view; +/− buttons or keys zoom within bounded limits. Clicking a projected component label shows an accessible description. Home/reset restores the view, patrol starting positions and selection. Pause freezes both UAV patrol and signal animation; resuming continues from the same position.
- Mobile and reduced-motion visitors get manual exploration without an idle animation loop. Animation also stops offscreen or in a hidden tab. If WebGL is unavailable or its context is lost, the original thesis architecture image remains visible as a fallback.
- Card tilt and hover lighting apply only to a fine pointer. Scroll reveals respect reduced motion and expose content immediately on anchor navigation or printing.
- The portrait uses eager, high-priority loading; project images are lazy loaded. Explicit image dimensions reserve layout space.
- Skill categories list the tools used, without subjective percentage bars.

## Validation

No dependency installation or build step is required. Serve this directory with any static HTTP server and check:

1. Desktop and phone layouts, both themes, keyboard focus, and 200% zoom.
2. All four tabs with mouse and keyboard; search `attention unet`, then `tinyvit`; filter Embedded; search an unknown term; clear filters.
3. Disable JavaScript and confirm all projects, demos, and navigation remain available.
4. Block local storage and verify theme switching, tabs, and search still work.
5. Open a nested invalid URL on GitHub Pages to confirm the styled 404 and home link.

The September 2026 update passed JavaScript/CSS syntax checks, simulated-DOM interaction regressions, asset/anchor/ARIA checks, and text contrast calculations. Browser layout, WebGL hardware rendering, and screen-reader testing remain manual checks.

## Updating Content

- Update `index.html` for project descriptions, metrics, awards, publication details, and repository links.
- Replace `assets/JenWei_Kuo_Resume.pdf` whenever the CV changes.
- When replacing `profile.jpg` or `project10.jpg`, regenerate the corresponding WebP variants and update the intrinsic dimensions in `index.html`. Keep the originals for full-size viewing and social sharing.
- Keep external repository links public and verify each result before adding it to an award or metric statement.

## Deploying

GitHub Pages deploys from the `main` branch. Commit and push the site files:

```bash
git add index.html styles.css script.js theme-init.js thesis-scene.js systems3d.js 404.html robots.txt sitemap.xml README.md assets
git commit -m "Update portfolio"
git push origin main
```

The project uses plain HTML, CSS, and JavaScript; no build step is required.
