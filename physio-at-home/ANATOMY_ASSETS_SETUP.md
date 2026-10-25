# Interactive anatomy mannequin assets

The body-map component expects these two image files at the following paths:

- `physio-at-home/public/images/anatomy-front.jpg` — front-view grey mannequin
- `physio-at-home/public/images/anatomy-back.jpg` — back-view grey mannequin

The images are not source-controlled by this change because the GitHub text-file editor cannot upload binary image files. Add the two optimized JPEG files supplied with this change before deploying. Vite serves files inside `public/` from the site root, so the component references them as `/images/anatomy-front.jpg` and `/images/anatomy-back.jpg`.

The clickable regions remain keyboard accessible and update the existing body-area content. Selected regions are highlighted red; the front/back selector uses the matching image.
