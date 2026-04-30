# RunwayLink

RunwayLink is a LinkedIn-style professional networking web app for fashion models, product models, photographers, brands, and agencies. It is built with plain HTML, CSS, JavaScript modules, and Firebase services only.

## Features

- Firebase Email/Password authentication with role selection
- Role-based redirects to model and brand dashboards
- Editable model and brand profiles
- Casting board with applications saved to Firestore
- Search and discovery with location, category, and height filters
- Connection requests with accept and reject actions
- Inquiry form and lightweight inbox UI
- Portfolio gallery with Firebase Storage uploads and modal lightbox
- Downloadable comp card for model profiles
- Demo seed utility and local demo fallback when Firebase is not configured

## Firebase setup

1. Create a Firebase project.
2. Enable `Authentication > Email/Password`.
3. Create Firestore in production or test mode.
4. Create Firebase Storage.
5. Copy `.env.example` to `.env`.
6. Fill in:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

7. Deploy the included [firestore.rules](/D:/HarithaProject/firestore.rules) and [storage.rules](/D:/HarithaProject/storage.rules).

## Local development

```bash
npm install
npm run dev
```

## Demo data

- If Firebase is not configured, the UI automatically runs in local demo mode with sample models, brands, portfolio items, inquiries, connections, and casting calls.
- If Firebase is configured and your Firestore is empty, open the app in the browser console and run:

```js
window.runwayLinkSeedDemo()
```

That seeds Firestore with the included sample data.

## Collections used

- `users`
- `profiles`
- `castingCalls`
- `applications`
- `connections`
- `inquiries`
- `portfolioItems`

## File structure

```text
src/
  app.js
  auth.js
  firebase.js
  main.js
  styles.css
  data/
    demoData.js
  services/
    dataService.js
  ui.js
  utils.js
```
