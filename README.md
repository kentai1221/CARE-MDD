# 另存心檔

另存心檔 is a mobile-friendly mental-health study app built with Next.js. It provides separate treatment and active digital control pathways, mood ratings, persistent conversation threads, crisis keyword handling, and installable PWA support.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3006](http://localhost:3006).

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

Deploy the application over HTTPS. On a supported mobile browser, 另存心檔 can be installed from the login-page prompt or added to the device home screen and opened in standalone mode.
