# FileDrop — complete starter project

FileDrop is a Next.js document collection app using Supabase Storage, Supabase Auth, and optional Resend email notifications.

## Important security model

- The `uploads` Storage bucket must be **private**.
- The Supabase service-role key is used only in server-side route handlers. Never add it to a `NEXT_PUBLIC_` variable or client-side file.
- Visitors receive short-lived signed upload URLs from a server endpoint. Files are stored in the private bucket.
- Admin access requires a Supabase Auth user whose UUID is present in `public.admin_users`.
- Downloads are temporary signed URLs created only after the server confirms the admin session.
- Do not add public bucket policies.

## 1. Upload this project to GitHub

Upload the contents of this folder to the root of your existing `filedrop` repository. Keep the folder structure. If GitHub asks whether to replace existing files, replace the starter files with these project files. Do not upload `.env` or `.env.local`.

## 2. Install dependencies locally (optional)

```bash
npm install
npm run dev
```

## 3. Supabase setup

1. Open your Supabase project.
2. Go to Storage and confirm a bucket named `uploads` exists.
3. Open the bucket settings and confirm **Public bucket is OFF**.
4. Open SQL Editor → New query.
5. Copy and run all SQL from `supabase/schema.sql`.

## 4. Create your administrator

1. In Supabase, open Authentication → Users.
2. Choose Add user / Create new user.
3. Enter your admin email and a strong password. Confirm the user if the dashboard offers that option.
4. Copy the user's UUID from the Users table.
5. Open SQL Editor and run this query after replacing the placeholder with the UUID:

```sql
insert into public.admin_users (user_id)
values ('PASTE-AUTH-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Only add accounts you personally control to `admin_users`.

## 5. Vercel environment variables

Open Vercel → your FileDrop project → Settings → Environment Variables. Add these for Production, Preview, and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase publishable key (or legacy anon key)
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service_role/secret key (server-side only)

Optional email settings:

- `RESEND_API_KEY` — API key from Resend
- `NOTIFY_EMAIL` — the email address that should receive notifications
- `FROM_EMAIL` — sender identity verified with Resend. For initial testing, Resend's onboarding sender may only deliver to your account email.

Optional:
- `MAX_FILE_SIZE_MB` — server-side max size in MB; defaults to 20.

After adding or changing environment variables, trigger a new deployment in Vercel.

## 6. Test

1. Open the deployed website in a private/incognito window.
2. Upload a small PDF or image.
3. Open Supabase → Storage → uploads and confirm the object exists. The bucket must still be private.
4. Open `/admin/login` and sign in with the administrator account.
5. Confirm the upload appears in the dashboard.
6. Click Download. The link expires after 60 seconds.
7. Test from a second device.

## 7. Email notifications

Create a Resend account, create an API key, and configure a verified sender domain. Add the three email environment variables in Vercel and redeploy. If email variables are absent, uploads still work but no email is sent. Email delivery failures are logged in Vercel Function Logs and do not undo a successful upload.

## 8. Limits and production hardening

This starter validates file size and common document/image types. It does not yet include CAPTCHA, per-IP rate limiting, malware scanning, virus quarantine, upload quotas, or abuse monitoring. Because the upload page is public, add rate limiting and CAPTCHA before promoting it publicly. Browser-provided MIME types and filenames are not proof that a file is safe. Never open untrusted files on an administrator's computer without appropriate protection.

The upload URL endpoint uses a server-side service-role key to mint signed upload URLs. Keep that key private. If your existing Supabase project has custom policies, review them before launch.

## Troubleshooting

- **Missing environment variable:** Check Vercel project settings and redeploy.
- **Invalid login:** Confirm the user exists in Supabase Authentication → Users.
- **Login says not an administrator:** Confirm the exact auth user UUID has a row in `public.admin_users`.
- **Upload fails:** Confirm bucket name is exactly `uploads`, bucket is private, and the server-side service-role key is correct.
- **Dashboard is empty:** Confirm the upload-complete endpoint saved a row in `public.uploads`.
- **Email not received:** Check Resend sender verification, recipient restrictions, API key, and Vercel Function Logs.
