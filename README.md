# Notes & Blog Platform

Full-stack notes/blogging platform with JWT authentication, ownership-based
authorization, and public/private post visibility.

## Tech Stack
- Node.js + Express (server, routing)
- MongoDB + Mongoose (database, schemas)
- JWT (`jsonwebtoken`) - stateless session handling via httpOnly cookie
- bcryptjs - password hashing
- EJS - server-rendered views
- connect-flash - one-time success/error messages

## Folder Structure
```
notes-blog-platform/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js   # signup/login/logout logic
│   └── postController.js   # post CRUD logic
├── middleware/
│   ├── auth.js             # protect (required login) + attachUserIfExists (optional)
│   └── checkOwnership.js   # authorization: is this user the post's owner?
├── models/
│   ├── User.js              # schema + password hashing hook + comparePassword method
│   └── Post.js               # schema + visibility field + owner ref
├── routes/
│   ├── authRoutes.js
│   └── postRoutes.js
├── utils/
│   └── generateToken.js     # signs JWT + sets httpOnly cookie
├── views/                    # EJS templates
│   ├── partials/             # header/footer (nav, flash messages)
│   ├── auth/                 # login, signup
│   └── posts/                # index, new, show, edit
├── public/css/style.css
├── app.js                    # express app + middleware wiring
├── server.js                 # entry point (loads env, connects DB, starts server)
└── .env.example
```

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values (see comments inside
   that file — MONGO_URI and JWT_SECRET are the two you MUST change).
3. Make sure MongoDB is running locally, or use an Atlas connection string.
4. `npm run dev` (or `npm start`)
5. Visit `http://localhost:5000`

## Deploying to Vercel
Vercel runs the app through `api/index.js` as a serverless function. Add
`MONGO_URI`, `JWT_SECRET`, and `SESSION_SECRET` under the project's Environment
Variables in Vercel (for each environment you deploy), then redeploy. Vercel
does not use the local `.env` file, and it should not be committed.

## How Auth Works (for interview explanation)
1. **Signup**: password is hashed via bcrypt in a Mongoose `pre("save")` hook
   on the User model — controllers never touch raw hashing logic directly.
2. **Login**: `comparePassword()` (instance method on User) checks the
   candidate password against the stored hash.
3. On successful signup/login, `generateTokenAndSetCookie()` signs a JWT
   (`{ id: user._id }`) and sets it as an **httpOnly** cookie — this means
   client-side JS can't read/steal it (XSS protection), but it's still
   sent automatically on every request to this domain.
4. **`protect` middleware**: reads the token from the cookie, verifies it,
   loads the user from DB, and attaches it to `req.user`. Used on any route
   that requires login.
5. **`attachUserIfExists` middleware**: same idea but non-blocking — used on
   public routes (feed, single post) so we can conditionally show private
   content to its owner without forcing a login wall on public browsing.
6. **`checkOwnership` middleware**: runs AFTER `protect`, on edit/update/delete
   routes. Fetches the post and compares `post.owner` to `req.user._id`.
   This is the difference between **authentication** (protect: who are you)
   and **authorization** (checkOwnership: are you allowed to touch this
   specific resource).
7. **Visibility**: each post has `visibility: public | private`. The feed
   query and the single-post controller both filter/check this so private
   posts are only ever returned to their owner.

## Possible Extensions (if asked "what would you add next")
- Refresh tokens (separate short-lived access token + long-lived refresh token)
- Rate limiting on login/signup (e.g. `express-rate-limit`)
- Pagination on the posts feed
- Comments sub-resource
- Convert to a REST API + separate frontend (React) instead of EJS
