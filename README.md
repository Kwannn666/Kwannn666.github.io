# Jen-Wei Kuo Portfolio

Static GitHub Pages portfolio for Jen-Wei (Wayne) Kuo, covering AI/ML, edge AI, computer vision, wireless DRL, and embedded systems.

Live site: https://kwannn666.github.io/

## Structure

```text
.
|-- index.html                  # Content, diagrams, and project cards
|-- styles.css                  # Responsive styling
|-- script.js                   # Tabs, filters, search, theme, and motion
|-- 404.html
`-- assets/
    |-- JenWei_Kuo_Resume.pdf   # Current downloadable CV
    |-- favicon.svg
    `-- images/
        |-- profile.jpg
        `-- project1.jpg ... project10.jpg
```

## Portfolio Content

- AIDSP Edge AI Suite: four Jetson-targeted demos with CSS architecture diagrams and repository links.
- Research and projects: dual-UAV RIS-assisted SWIPT, ESG verification, CVPR children gait analysis, medical segmentation, embedded vessel, lightweight vision, RAG, and control systems.
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

The AIDSP, ESG, CVPR, and research cards use HTML/CSS architecture diagrams rather than unrelated placeholder images.

## Updating Content

- Update `index.html` for project descriptions, metrics, awards, publication details, and repository links.
- Replace `assets/JenWei_Kuo_Resume.pdf` whenever the CV changes.
- Keep external repository links public and verify each result before adding it to an award or metric statement.

## Deploying

GitHub Pages deploys from the `main` branch. Commit and push the site files:

```bash
git add index.html styles.css script.js README.md assets
git commit -m "Update portfolio"
git push origin main
```

The project uses plain HTML, CSS, and JavaScript; no build step is required.
