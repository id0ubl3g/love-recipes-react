# Supabase Setup

One-time steps in the Supabase dashboard (and, for the optional Google login, in Google Cloud) to run the Love Recipes React. Replace `<project-ref>` with your project reference, the subdomain in `https://<project-ref>.supabase.co`.

## 1. Create the tables, access rules and validations

In **SQL Editor**, run the files in [`supabase/migrations/`](supabase/migrations/) in order:

| File | What it creates |
| ---- | --------------- |
| `20261017120000_init.sql` | `recipes`, `categories` and `profiles` tables with RLS (each user accesses only their own rows) and the `recipe-images` bucket |
| `20261017140000_signup_email_validation.sql` | Blocked email domains list and the `hook_validate_signup` function |
| `20261017150000_content_limits.sql` | Limits for ingredients, steps and categories |

Each file runs once. Running it again fails with "already exists" errors.

## 2. Allowed URLs

Open **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** add `http://localhost:5173/**`

When the site goes live, add the production URL too, for example `https://your-domain.com/**`. Password recovery links only redirect to allowed URLs.

## 3. Email and password sign up

In **Authentication → Sign In / Providers → Email**:

- **Confirm email:** off. The account is created and signed in right away; the email is used for **password recovery**.
- **Minimum password length:** `8`
- **Password requirements:** *Lowercase, uppercase letters, digits and symbols* (the same rules the app shows as a checklist)

### Server-side email validation

In **Authentication → Hooks**, add a **Before User Created** hook of type **Postgres** pointing to `public.hook_validate_signup`. It rejects invalid email formats, disposable domains (mailinator, yopmail...) and reserved domains (example.com), even for requests that skip the app.

To block more domains:

```sql
insert into public.blocked_email_domains (domain) values ('domain.com');
```

## 4. Email delivery (SMTP)

The default Supabase email service only sends to **members of the project team**, at most 2 emails per hour. For password recovery to reach any address, configure your own SMTP in **Authentication → Emails → SMTP Settings**.

| Option | Settings | Notes |
| ------ | -------- | ----- |
| Gmail | Host `smtp.gmail.com`, port `465`, user = the Gmail address, password = an [app password](https://myaccount.google.com/apppasswords) | No domain needed. About 500 emails per day; requires 2-Step Verification on the account |
| Resend | Host `smtp.resend.com`, port `465`, user `resend`, password = the API key | Free up to 3,000 emails per month. Needs a verified domain to send to any address |

Then:

- Set **Sender name** to `Love Recipes`.
- In **Authentication → Rate Limits**, raise the email limit from the default (for example, to 30 per hour).
- Optionally, translate the **Reset Password** template in **Authentication → Emails → Templates**. The link must keep `{{ .ConfirmationURL }}`.

## 5. Google login (optional)

The app works with email and password only. The **Continuar com Google** button stays hidden until `VITE_ENABLE_GOOGLE_LOGIN=true` is set in `.env.local`.

### In Google Cloud Console (<https://console.cloud.google.com>)

1. Create a project, or use an existing one.
2. **APIs & Services → OAuth consent screen**:
   - user type **External**;
   - fill in the app name ("Love Recipes"), the support email and the developer email.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type:** Web application
   - **Authorized JavaScript origins:** `http://localhost:5173`
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and the **Client secret**.

### In Supabase

In **Authentication → Sign In / Providers → Google**, turn it on, paste the Client ID and the Client secret, and save.

> The Google client secret lives **only in the Supabase dashboard**. Never put it in the code or in `.env.local`.

## 6. App variables

Copy `.env.example` to `.env.local` (ignored by git) and fill in:

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both values are in **Project Settings → API Keys**. The **publishable** key is safe in the frontend: the data is protected by the RLS rules from step 1. Never use the secret / `service_role` key in the app.

After creating or changing `.env.local`, **restart `npm run dev`**.

## Content limits

Enforced in the database and in the app ([`src/lib/limits.ts`](src/lib/limits.ts)), so change both together:

| Field | Limit |
| ----- | ----- |
| Title / description | 80 / 160 characters |
| Ingredients | 1 to 50 per recipe, up to 150 characters each |
| Steps | 1 to 30 per recipe, up to 600 characters each |
| Custom categories | 20 per user, name up to 24 characters |

## How the data works

- Every account starts **empty**.
- On the first login, if the browser has recipes created with the old LocalStorage version of the app, those recipes and the custom categories are imported into the account and the photos are uploaded to Storage. The LocalStorage data is cleared afterwards.
- The example recipes of the old version are **not** imported.
