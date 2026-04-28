# Jen-Wei Kuo GitHub Pages Portfolio

這是一份可直接部署到 GitHub Pages 的靜態作品集網站。

## 檔案結構

```text
.
├── index.html
├── styles.css
├── script.js
├── 404.html
├── README.md
└── assets/
    ├── favicon.svg
    ├── JenWei_Kuo_Resume.pdf      # 你可以自行放入履歷 PDF
    └── img/
        └── profile-placeholder.svg # 可替換成個人照片或專案圖
```

## 部署到 `Kwannn666.github.io`

1. 解壓縮這個資料夾。
2. 把全部檔案複製到你的 `Kwannn666.github.io` repo 根目錄。
3. Commit and push：

```bash
git add .
git commit -m "Build portfolio website"
git push origin main
```

4. 到 GitHub repo：
   `Settings → Pages → Build and deployment → Source: Deploy from a branch`
5. 選：
   `Branch: main`，資料夾選 `/root`
6. 等 1–3 分鐘後開啟：

```text
https://Kwannn666.github.io
```

## 建議你替換的地方

- `assets/img/profile-placeholder.svg`：換成你的大頭照或正式形象照，檔名可保持不變。
- `assets/JenWei_Kuo_Resume.pdf`：放你的履歷 PDF，讓首頁按鈕可以下載。
- `index.html` 裡的 GitHub / Kaggle 連結：改成你的真實 profile URL。
- 專案卡片中的 GitHub / Demo 連結：如果有 repo，可以加在每張 card 內。

## 功能

- RWD 響應式排版
- 深色 / 淺色模式切換
- 專案分類篩選
- 專案關鍵字搜尋
- Scroll reveal 動畫
- GitHub Pages 無需 build，純 HTML/CSS/JS 可直接跑


## Thesis PDF

The thesis PDF is stored at `assets/papers/Voronoi-Based_Energy-Aware_User_Partitioning_and_DRL_Resource_Allocation_in_Dual-UAV_RIS-Assisted_SWIPT_Networks.pdf`. Replace this file if you update the paper version.
