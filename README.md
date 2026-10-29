# Tweetie

A social publishing app built with React, Express and MongoDB. Share posts and images, follow people, search conversations and hashtags, and improve a draft with an optional Gemini writing assistant.

[Hosted application](https://tweetie-five.vercel.app) · [Repository](https://github.com/Aryangupta-05/Tweetie)

The hosted application may run an earlier revision. Features below have been checked locally; a source-code push does not by itself confirm a deployment.

## Features

- Responsive dark interface with glass styling, desktop navigation and mobile compose controls.
- Signup, login and logout using hashed passwords and HTTP-only JWT cookies.
- Posts up to 500 characters, image previews and PNG/JPEG/WebP/GIF attachments up to 4 MB.
- Likes, replies, post details, following and editable profiles with profile/cover images.
- Bookmarks stored per account in MongoDB.
- User/post search with case-insensitive literal matching and complete hashtag matching.
- Followers/following lists, profile counts and notifications with explicit mark-as-read.
- Account-specific text drafts saved in the browser, with loading/error/retry states.
- **Improve with AI:** preview a grammar/clarity edit, then choose **Use suggestion** or **Keep original**. Applying does not publish the post.
- Portfolio and GitHub attribution links.

## Stack and request flow

| Layer | Technology |
| --- | --- |
| UI | React 18, React Router, CSS, Tailwind/DaisyUI, Vite |
| Server state | TanStack Query v5 |
| API | Node.js, Express |
| Data and authentication | MongoDB/Mongoose, bcrypt, JWT cookies |
| Media | AWS SDK v3 for S3, with Cloudinary fallback |
| Writing assistant | Gemini REST API through Node's native fetch |
| Background ranking | node-cron |
| Optional EC2 process management | PM2 |

The browser calls Express through `/api`. Authentication middleware verifies the session, handlers read/write MongoDB, and TanStack Query refreshes the relevant UI data.

Writing assistance follows `Composer → POST /api/ai/improve → Gemini → suggestion preview`. The key stays on the server. Requests contain the draft; responses contain `original` and `suggestion`. The editor preserves meaning and language, repairs broken wording, and avoids follow-up questions or invented facts. The author reviews the result before applying it.

## Run locally

Use Node.js 22 or newer, an existing MongoDB database and a configured media provider.

### Backend

From the repository root:

```bash
cd backend
npm ci
```

Create `backend/.env`:

```dotenv
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://127.0.0.1:3000

# Cloudinary, used when S3 is not configured
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Optional writing assistant
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional S3 configuration
# AWS_REGION=us-east-1
# AWS_BUCKET_NAME=your_bucket
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
```

```bash
npm run dev
```

Without a Gemini key, social features still work; the assistant displays a configuration error when requested.

### Frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local`:

```dotenv
VITE_API_URL=
```

An empty API origin uses the Vite proxy to the local backend on port 5000.

```bash
npm run dev -- --host 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Use the same hostname consistently for cookie-based login.

## Validation

From `backend`:

```bash
node --test tests/draftImprover.test.js
```

From `frontend`:

```bash
npx eslint src/live src/App.jsx
npm run build
```

Unit checks cover draft bounds, provider errors, incomplete/oversized output, response shape and literal/hashtag search. Local integration checks also exercised authentication, publishing, media delivery, bookmarks, search, profiles and real Gemini responses. Credentials and local verification data are excluded from Git.

## API additions

All routes below require a signed-in user.

| Route | Purpose |
| --- | --- |
| `POST /api/ai/improve` | Edit a draft of 1–500 characters |
| `GET /api/search?q=...` | Search people/posts; 2–80-character query |
| `PUT /api/posts/:id/bookmark` | Set the current user's saved state |
| `GET /api/posts/saved` | Read saved posts |
| `GET /api/posts/detail/:id` | Read a post with its author/replies |
| `GET /api/users/:username/stats` | Read profile counts |
| `GET /api/users/:username/connections?type=followers&page=0` | Read followers or following, 50 per page |
| `PATCH /api/notifications/read` | Mark notifications read |

Gemini calls have a 45-second timeout and an in-memory limit of five requests per user per minute per Node process. Cancelling the browser request preserves the draft. The last result for an exact draft is cached in the composer for up to five minutes; requesting another suggestion bypasses it. Provider latency and quotas can still produce handled errors.

## Media and deployment

The existing S3 upload/delete helpers remain available. Required AWS environment settings select S3; otherwise the media helper uses Cloudinary. The configured provider must serve the uploaded image URLs to browsers.

`backend/ecosystem.config.cjs` and `backend/scripts/setup-ec2.sh` provide the existing PM2/EC2 setup. S3 uploads and EC2 deployment were not verified during the local UI work; checked local uploads used Cloudinary.

`frontend/vercel.json` forwards hosted `/api` requests to its configured backend. Update that destination if backend hosting changes, and configure the corresponding server environment variables.

## Feed ranking

For you returns up to 20 posts sorted by a stored score:

```text
score = (likes + 5 × comments) / (ageInHours + 2)^1.5
```

A background job refreshes scores at startup and every ten minutes. Following and profile feeds use their existing API routes.

## Project structure

```text
backend/
  controllers/             Authentication, posts, profiles and notifications
  middleware/protectRoute.js
  models/                  User, post and notification documents
  routes/experience.route.js
  lib/draftImprover.js      Server-side Gemini call
  lib/searchFilter.js       Literal and complete-hashtag matching
  lib/mediaUpload.js        Configured media-provider selection
  lib/s3.js                S3 upload/delete helpers
  scripts/ranker.js
  tests/draftImprover.test.js
frontend/
  src/App.jsx              Production application entry
  src/live/                Connected screens, shared styles and API hooks
  vercel.json              Hosted API forwarding
```
