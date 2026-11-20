# EstateCraft — frontend (Angular 21)

Customer site (`/`, `/homes`, `/homes/:id`, `/saved`, `/enquiries`, `/login`, `/signup`) and Admin console (`/admin/...`).

## Run
```bash
npm ci
npm start            # http://localhost:4200  (API defaults to http://127.0.0.1:8000/api on localhost)
npm run build        # production build -> dist/estatecraft/browser
```

## Pointing at your API (no rebuild needed)
Edit `public/config.js` (copied as `config.js` into the build):
```js
window.EC_CONFIG = { apiUrl: 'https://YOUR-API-HOST/api' };
```
Empty = `http://127.0.0.1:8000/api` on localhost, same-origin `/api` anywhere else.
On **AWS Amplify** just set the `API_URL` environment variable — `amplify.yml` writes `config.js` for you.
The API URL must be **https://** when the site is served over https.

## Amplify checklist
1. Connect the repo; Amplify picks up `amplify.yml`.
2. Environment variable `API_URL` = your HTTPS API base (ending in `/api`).
3. Rewrites and redirects → add (type 200): source `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|avif)$)([^.]+$)/>` target `/index.html`.
4. Add the Amplify domain to `CORS_ALLOWED_ORIGINS` on the backend.

## Design notes
Warm "coastal editorial" identity: Fraunces + Instrument Sans, sand/ink/ember/gold palette, arch-shaped imagery.
Motion: scroll reveals, count-ups, parallax, card tilt + photo cycling, view-transition page fades — all disabled automatically for `prefers-reduced-motion`.
Cities, localities and categories come from the API (`meta_get/`), so adding a city in Admin → Locations updates every search form.
