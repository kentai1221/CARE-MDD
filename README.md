# CARE-MDD

CARE-MDD is a mobile-friendly CBT support chatbot built with Next.js. It includes a hardcoded single-user login, persistent conversation threads, crisis keyword handling, and installable PWA support.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

Development login:

- Username: `admin`
- Password: `admin`

## Environment variables

Create a local `.env` file containing the required server-side credentials:

```env
CONVAI_API_KEY=
CONVAI_CHAR_ID=
GOOGLE_TTS_API_KEY=
```

The `.env` file and locally stored conversation data are excluded from Git.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm start
```

## PWA installation

Deploy the application over HTTPS. On a supported mobile browser, CARE-MDD can be installed from the login-page prompt or added to the device home screen and opened in standalone mode.
