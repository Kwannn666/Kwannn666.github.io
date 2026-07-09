# Jen-Wei Kuo Portfolio

Static GitHub Pages portfolio for Jen-Wei (Wayne) Kuo.

Live site: https://kwannn666.github.io/

## Structure

```text
.
|-- index.html                  # Content and project cards
|-- styles.css                  # Responsive styling
|-- script.js                   # Tabs, filters, search, theme, and motion
|-- 404.html
`-- assets/
    |-- JenWei_Kuo_Resume.pdf   # Current downloadable CV
    |-- favicon.svg
    `-- images/
        |-- profile.jpg
        `-- project2.jpg ... project10.jpg
```

## Updating Content

- Edit `index.html` to update project descriptions, experience, awards, and links.
- Keep each project image paired with its matching project card. The current mapping is:
  - `project2`: Image Processing and YOLO Recognition
  - `project3`: Unified-OneHead Multi-Task Learning
  - `project4`: DynamicConv
  - `project5`: TinyViT
  - `project6`: MLB Game Prediction
  - `project7`: Interactive Resume and Interview System
  - `project8`: Traffic Accident Prediction
  - `project9`: Two-Wheel Balance Car with LQR
  - `project10`: Intelligent Unmanned Vessel
- Replace `assets/JenWei_Kuo_Resume.pdf` whenever the CV is updated.

## Deploying

GitHub Pages deploys from the `main` branch. Commit and push the site files:

```bash
git add index.html styles.css script.js README.md assets
git commit -m "Update portfolio"
git push origin main
```

The project uses plain HTML, CSS, and JavaScript; no build step is required.
