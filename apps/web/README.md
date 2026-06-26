# Frontend structure

```
apps/web/
├── index.html              # landing page
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js       # API URL, routes, storage keys
│       ├── auth.js         # login, tokens
│       ├── data.js         # mock data (until API wired)
│       └── app.js          # UI rendering, modals
├── pages/
│   ├── goals.html
│   ├── goal-detail.html
│   ├── family.html
│   ├── wishlist.html
│   ├── my-wishlist.html
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   └── legacy/             # redirects to wishlist?id=
├── docs/                   # AUTH_README, QUICKSTART, …
└── tools/                  # diagnostic.html, API_TESTS.js
```

All asset and page links use **root-absolute paths** (`/assets/...`, `/pages/...`) so they work from any page depth when served via nginx or Live Server with `apps/web` as root.

Routes are defined in `assets/js/config.js` as `APP_ROUTES`. Dynamic links in `app.js` use `routeUrl()`.

## Local dev without Docker

Open `apps/web` as the web root in Live Server (VS Code). API on `http://localhost:3000` is picked up automatically by `config.js`.

## Old URLs

nginx redirects `/goals.html`, `/login.html`, etc. to the new paths under `/pages/`.
