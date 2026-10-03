# Summit Stories
A welcoming space where stories, experiences, ideas, and creativity come together
WebBlog sharing App created by Mithun Mohandas

Built with Next.js App Router, React, TypeScript, and Tailwind CSS.
Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Routes live in `src/app` and images in `public/images`.

## Login and blog builder

Copy `.env.example` to `.env.local` (or `.env`). Set `NEXTAUTH_SECRET` to a random
secret and replace the sample `BLOG_USERS` array with your username/password
combinations. Each account needs only `username` and `password`; `name` is optional
and defaults to the username. Matching is exact: case and whitespace must match.
Every listed username/password pair is accepted. Restart the server after
changing these values. The environment files are ignored by Git; credentials
stay on the server and are never included in exported blogs.

Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Go to `/login`, then `/builder`. Authenticated authors can add and reorder
paragraphs, subheadings, images, YouTube videos, image carousels, and rows with
up to three columns. Rows can contain other blocks. Use HTTPS image URLs or
existing `/images/` paths. Images remain links in the JSON; no file upload or
server-side publication happens when downloading.

Preview uses the same renderer as published stories. **Export JSON** validates
the content and saves `<Blog title>.json` (characters invalid in filenames are
removed). **Import JSON** reopens a downloaded story. Changes remain in the
current tab until downloaded; the editor warns before closing with changes.

## JSON blog content

Published stories are individual JSON files in `public/blogs`. The folder starts empty.
Each file has `version`, `slug`, `title`, `author`, `authorUsername`, `description`, `coverImage`,
`createdAt`, and a `content` array of typed blocks. Rows have `columns`, each with
its own `content` array. Block IDs must be unique and slugs must be unique across
published files. `src/lib/blog-schema.ts` defines and validates the full format.

To publish a downloaded story, copy its JSON into `public/blogs` and redeploy.
The filename can remain the blog title; the story's `slug` controls its URL.
Remove or replace an earlier file if publishing an update with the same slug.
Public files are public content, so do not include private information.

- `GET /api/blogs`: summaries for blog listings; accepts `?author=username`.
- `GET /api/blogs/[slug]`: complete blog JSON, or 404.
- `/blogs/[slug]`: renders a story from the JSON files.

`/blogs?author=unix00001` shows only that username's stories. Matching is
case-insensitive and exact, so `unix00001` also matches `UNIX00001`.
Without a username (or with an empty `author` query), all stories are listed.
Downloads include the logged-in user's `authorUsername` separately from the
display name in `author`. For older JSON files, add `authorUsername` to enable
username filtering; files without it can still be filtered by their `author` value.

Downloads do not write to the server, so this workflow also works on Vercel.

The gallery collects cover images, image blocks, and carousel slides from all
published blogs, including nested rows and columns. Repeated image URLs appear
once. It shows four columns on desktop and two on smaller screens, with captions
below lazy-loaded thumbnails. Images open in a modal with fullscreen controls;
Escape, the close button, or a click outside the modal closes it. Missing captions
fall back to alternative text or the blog title.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the production build. Vercel can detect Next.js automatically;
use the Next.js framework preset and default build/output settings when deploying.
Other hosts need a Node.js runtime to run `npm start` after `npm run build`.
Set `NEXTAUTH_URL` to the site's production URL and configure the same account
and secret environment variables on the deployment host. Use HTTPS in production.

Browser tests use isolated test accounts and require a production build:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```
