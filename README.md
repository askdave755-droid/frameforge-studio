# Frameforge Studio

A polished image-to-video production dashboard inspired by the supplied review-dashboard repository, redesigned for short-form visual stories.

## What is included

- Image-first project workflow with drag and drop upload state
- Prompt-driven motion direction, aspect ratio, duration, and visual style controls
- Voice library with searchable voice cards, accents, tone labels, and preview buttons
- Storyboard timeline for opening / reveal / closing scenes
- Simulated render queue with progress, toast feedback, and downloadable preview state
- Responsive dark editorial UI with no external assets or network-only fonts

## Run it

```bash
npm install
npm run dev
```

The UI runs in demo mode without API keys. The provider boundary is intentionally simple to connect to a real image-to-video service later: replace `runRender()` in `src/App.jsx` with your backend call and send the selected image, prompt, voice ID, and render settings.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`. After pushing to `main`, enable **Settings → Pages → Source: GitHub Actions** in the repository. The site will be published at:

```text
https://askdave755-droid.github.io/frameforge-studio/
```
