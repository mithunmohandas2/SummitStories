# Summit Stories

A publishing platform for travel stories, photography, and personal experiences. Readers can explore stories and galleries, while authenticated authors create and manage posts through a visual blog builder.

Created by **Mithun Mohandas**.

## Features

- **Visual blog builder:** Paragraphs, subheadings, images, YouTube embeds, image carousels, and nested rows with up to three columns.
- **Flexible editing:** Insert blocks below the current block, reorder content, preview stories, and expand paragraph fields automatically to fit their text.
- **Author accounts:** Username/password authentication, with editing and deletion restricted to the author who owns the blog.
- **Image uploads:** Direct Cloudinary uploads with WebP conversion, resizing, progress feedback, and confirmation before removal.
- **Publishing:** MongoDB persistence, stable story URLs when titles change, and a fresh builder after successful publication or updates.
- **Content portability:** Import and export validated JSON files named after the blog title.
- **Story discovery:** Author filtering, publication-date sorting, and alphabetical title sorting with shareable URLs.
- **Image viewer:** Lazy-loaded images, a responsive gallery, captions, and fullscreen viewing from galleries and blog pages.
- **Themes:** Light, dark, and browser-default modes available from the header settings menu.
- **Installable app:** Android home-screen installation, standalone app windows, branded icons, and an offline fallback.
- **Feedback:** Success and error notifications for authentication, publishing, downloads, uploads, and deletion.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Authentication | NextAuth.js credentials provider |
| Database | MongoDB |
| Image storage | Cloudinary |
| Validation | Zod |
| Notifications | React Hot Toast |
| Testing | Node.js test runner with tsx, Playwright |

## Getting started

### Prerequisites

- Node.js **20.9 or newer** and npm.
- A reachable MongoDB instance, either local or hosted.
- A Cloudinary account for direct uploads and Cloudinary image deletion.

### Installation

```sh
npm ci
```

Copy [`.env.example`](.env.example) to `.env.local` or `.env`, then replace the placeholder values. Generate a session secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/login` to access `/builder`.

## Installing on Android

Deploy the app over **HTTPS**, then open it in Chrome on Android. Select the
header settings gear and **Install app**, or use Chrome's menu and choose
**Install app** / **Add to Home screen**. Confirm installation to launch Summit
Stories from the phone's home screen in a standalone window. No APK download or
Play Store listing is required for this browser installation.

On iPhone or iPad, open the site in Safari and use **Share > Add to Home Screen**.

The production build registers `/sw.js` and publishes `/manifest.webmanifest`.
If the connection is unavailable, full-page navigation displays a branded offline
screen. Reading fresh content, signing in, publishing, and uploads require a
network connection. The service worker caches app icons and static build assets;
it does not cache API responses, authentication pages, or private builder HTML.
Existing 90-second blog caching and mutation invalidation still apply.

Service worker registration is disabled during `npm run dev`. Test installation
and offline behavior with `npm run build` followed by `npm start`. Localhost is
supported for local testing; a phone accessing an HTTP LAN address needs an HTTPS
deployment instead. After modifying offline assets or caching rules, increment the
cache version in `public/sw.js` so activation replaces the previous app cache.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | Application origin, such as `http://localhost:3000`. Set the public HTTPS origin in production. |
| `NEXTAUTH_SECRET` | Secret used to protect authentication sessions. Required for login. |
| `BLOG_USERS` | JSON array of authorized username/password combinations. Required for login. |
| `MONGODB_URI` | MongoDB connection string used to read and publish blogs. |
| `MONGODB_DB` | Database name. Defaults to `summitstories`. |
| `CLOUDINARY_URL` | Cloudinary credentials used by the server for image uploads and deletion. |

Example configuration:

```dotenv
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-generated-secret
BLOG_USERS='[{"username":"writer","password":"replace-with-a-strong-password","name":"Example Writer"}]'

MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=summitstories

CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name
```

Restart the server after changing environment variables. Keep these values server-side; do not prefix them with `NEXT_PUBLIC_`. Environment files are ignored by Git, except for `.env.example`.

### Author accounts

Each `BLOG_USERS` entry requires `username` and `password`. The optional `name` field controls the displayed author name and defaults to the username.

Login matches username/password combinations exactly, including case and whitespace. Blog ownership uses the username, so authors with identical display names remain separate accounts. Removing an account from `BLOG_USERS` invalidates its existing sessions.

### Cloudinary permissions

The API key in `CLOUDINARY_URL` needs permission to create/upload and delete image assets in the target folder. Valid credentials alone do not guarantee these permissions. A response containing `missing permissions` must be resolved in the Cloudinary account's API key or role settings.

Uploads use signed server requests; an unsigned upload preset is not required. In Cloudinary's dynamic folder mode, new images appear under:

```text
Summit Stories/Builder/<username>
```

## Writing and publishing

1. Sign in and open **Blog builder**.
2. Enter the title, description, and optional cover image.
3. Add content using the buttons at the end of the editor or the plus menu beside any block. The plus menu inserts content immediately below that block, including inside columns.
4. Use **Preview** to review the story with the same renderer used on published blog pages.
5. Select **Publish** to save the blog to MongoDB. After a successful publish or update, the builder clears its content and returns to a new draft.

Paragraph removal and image removal require confirmation. Failed publication preserves the draft. Drafts otherwise remain in the current editor session; export JSON to keep a separate copy before leaving.

### Editing and deleting

Blog owners see **Edit blog** and **Delete blog** actions on their cards and blog pages. Editing opens the existing story in the builder. Publishing an edit updates that record while preserving its public URL and first publication date.

Deleting a blog requires confirmation and checks ownership on the server. Successful deletion refreshes the visible list and invalidates the associated caches. Cloudinary image cleanup is part of this operation; see the image lifecycle below.

### Image uploads and lifecycle

Use **Attach cover image** or **Attach image** to upload a file. Pasted HTTPS image URLs and local `/images/` paths remain supported.

| Setting | Behavior |
| --- | --- |
| Accepted files | PNG, JPG/JPEG, WebP |
| Maximum source size | 20 MB |
| Output format | WebP |
| Maximum dimensions | Fits within 1200 x 1200 pixels, preserving aspect ratio |
| Compression quality | 70%; already-small WebP images can retain their existing encoding |
| Maximum optimized upload size | 4 MB |

The server also validates file signatures, applies request-size limits, and requests Cloudinary optimization. The returned URL is inserted into the builder automatically. JSON exports contain image links rather than image data.

Image deletion follows two workflows:

- **Removing content in the builder:** Confirmation removes the selected image, slide, block, or column. Builder uploads belonging to the logged-in user are also deleted from Cloudinary. Other image URLs are detached from the draft. Deleting an uploaded file affects every place using that same file, including published content; publish the edited draft to update its saved references.
- **Deleting a published blog:** Cleanup includes its cover, image blocks, carousel slides, and nested content. Images in the configured Cloudinary account are deleted, including manually pasted Cloudinary links, unless another published blog still references the asset. Uploads belonging to another username, images in other Cloudinary accounts, and external images are preserved.

If Cloudinary cleanup fails during blog deletion, the blog record remains so the operation can be retried. Cloudinary and MongoDB do not form a single transaction: an earlier successful image deletion is not rolled back if a later step fails. Abandoning a draft does not automatically delete its uploaded assets.

## Browsing and caching

The `/blogs` page provides author filtering and four sort orders:

| Query | Result |
| --- | --- |
| `author=writer` | Stories attributed to that username |
| `sort=newest` | Most recently published first; the default |
| `sort=oldest` | Earliest published first |
| `sort=title-asc` | Titles A-Z |
| `sort=title-desc` | Titles Z-A |

For example, `/blogs?author=writer&sort=oldest` combines the author filter and date order. Author matching is exact and case-insensitive. Legacy content without `authorUsername` can match its `author` value.

Date sorting uses `publishedAt`, rather than the draft's `createdAt`. Older MongoDB records without an explicit publication date use their ObjectId timestamp when available.

Public blog reads use the Next.js data cache with a **90-second revalidation interval**. The browser also reuses identical list requests for **90 seconds**, including pending requests. Sorting and author filtering on the blogs page reuse the loaded list. Publishing, updating, and deleting invalidate the relevant caches; editor loading and ownership checks read fresh database data.

A full reload resets the browser memory cache. Development-mode hard refreshes and `Cache-Control: no-cache` requests can bypass the server cache, so browser request headers alone do not indicate whether a database result was reused.

## Data model

Published blogs live in the MongoDB `blogs` collection. JSON files are used for import and export; placing a file in `public/blogs` does not publish it.

The format is defined in [`src/lib/blog-schema.ts`](src/lib/blog-schema.ts). A minimal example:

```json
{
  "version": 1,
  "slug": "a-journey-to-remember",
  "title": "A Journey to Remember",
  "author": "Example Writer",
  "authorUsername": "writer",
  "description": "Notes from a weekend in the hills.",
  "coverImage": "",
  "createdAt": "2026-01-01T09:00:00.000Z",
  "publishedAt": "2026-01-02T10:00:00.000Z",
  "content": [
    {
      "id": "intro",
      "type": "paragraph",
      "text": "The journey began before sunrise."
    }
  ]
}
```

Supported block types are `paragraph`, `heading`, `image`, `youtube`, `carousel`, and `row`. Rows contain columns with their own content arrays. Validation enforces unique block IDs, valid image and YouTube URLs, and content size and nesting limits. JSON imports and exports are limited to 1 MB.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Home page and latest blogs |
| `/blogs` | Blog listing, author filter, and sorting |
| `/blogs/[slug]` | Published blog reader |
| `/gallery` | Images collected from published blogs |
| `/about` | About page |
| `/login` | Author sign-in |
| `/builder` | Authenticated blog editor |
| `/builder?edit=<slug>` | Edit an owned blog |

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/blogs` | Public | Blog summaries; accepts `?author=<username>` |
| POST | `/api/blogs` | Authenticated | Publish a blog, or update an owned blog with the same slug |
| GET | `/api/blogs/[slug]` | Public | Complete blog content |
| PUT | `/api/blogs/[slug]` | Owner | Update a blog without changing its URL |
| DELETE | `/api/blogs/[slug]` | Owner | Clean up eligible Cloudinary images and delete the blog |
| POST | `/api/images` | Authenticated | Upload an image using multipart form field `file` |
| DELETE | `/api/images` | Upload owner | Delete a builder-managed image using JSON `{ "url": "..." }` |

Authentication endpoints under `/api/auth` are managed by NextAuth.js. API failures return an `error` message that the interface presents through notifications or inline feedback.

## Project structure

```text
src/
  app/                 Next.js pages, layouts, and API route handlers
  components/
    blog/              Blog rendering, image viewing triggers, and owner actions
    builder/           Content editor, image uploads, and insertion controls
    gallery/           Gallery grid and shared fullscreen image viewer
  layouts/             Shared application layout components
  lib/                 Authentication, storage, caching, validation, and utilities
  types/               Application type declarations
  views/               Page-level views and blog listings
public/
  images/              Static image assets
tests/
  unit/                Unit and regression tests
  e2e/                 Playwright browser specifications
```

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit and regression tests |
| `npm run test:e2e` | Run Playwright browser specifications |

Run the core checks before submitting changes:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Playwright requires installed browser binaries and a production build:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

The browser configuration starts a server on `127.0.0.1:3100` and supplies test login accounts. It does not isolate database or Cloudinary credentials. Some existing specifications still create legacy `public/blogs` fixtures and need migration to the MongoDB workflow; they should not be treated as complete coverage of the current application.

## Production deployment

Deploy to a Node.js environment that supports Next.js App Router and Route Handlers. The application requires a server runtime for authentication, MongoDB access, and Cloudinary operations; it is not a static export.

Configure the environment variables on the deployment host, use the deployed HTTPS origin for `NEXTAUTH_URL`, and verify connectivity to MongoDB and Cloudinary. Build and start with:

```sh
npm ci
npm run build
npm start
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login is not configured | Confirm `NEXTAUTH_SECRET` and a valid, non-empty `BLOG_USERS` JSON array, then restart the server. |
| Username or password is rejected | Check the exact combination, including case and whitespace. |
| Database unavailable | Check `MONGODB_URI`, database connectivity, and the deployment's network access. |
| Cloudinary reports missing permissions | Verify the API key's asset creation/upload and deletion permissions for the target folder. |
| Uploaded images cannot be deleted | Check Cloudinary deletion permissions and whether the image belongs to the current account or user. |
| A directly changed database record is not immediately reflected | Allow the 90-second cache window to revalidate; mutations made through the application invalidate caches automatically. |
