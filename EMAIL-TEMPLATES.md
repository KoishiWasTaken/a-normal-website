# Email Templates - Black/Green ARG Theme

Custom email templates for Supabase Auth that match the "a normal website" aesthetic.

## 📧 How to Update Email Templates

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select each template type
4. Replace the content with the HTML below
5. Click **Save**

---

## 1. Confirm Signup (Email Verification)

**Template Name:** Confirm signup

**Subject:** verify your email for a normal website

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace;
      background-color: #000000;
      color: #a3e635;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #2d4a1f;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: normal;
      margin: 0;
      color: #a3e635;
      letter-spacing: 2px;
    }
    .content {
      background-color: #0a0a0a;
      border: 1px solid #2d4a1f;
      padding: 30px;
      margin-bottom: 30px;
    }
    .content p {
      line-height: 1.6;
      margin: 0 0 15px 0;
      color: #a3e635;
    }
    .button {
      display: inline-block;
      background-color: #a3e635;
      color: #000000;
      padding: 12px 30px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
      border: none;
      font-family: 'Courier New', Courier, monospace;
    }
    .button:hover {
      background-color: #84cc16;
    }
    .link {
      word-break: break-all;
      color: #65a30d;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #4d7c0f;
      margin-top: 30px;
    }
    .warning {
      color: #65a30d;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>a normal website</h1>
    </div>

    <div class="content">
      <p>welcome.</p>

      <p>you need to verify your email address to continue.</p>

      <p>this is completely normal. just standard procedure.</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          verify email
        </a>
      </center>

      <p class="warning">or copy this link into your browser:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p class="warning">this link expires in 24 hours.</p>
    </div>

    <div class="footer">
      <p>if you didn't create an account, you can safely ignore this.</p>
      <p>© 2025 a normal website. all rights reserved. probably.</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password

**Template Name:** Reset password

**Subject:** reset your password - a normal website

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace;
      background-color: #000000;
      color: #a3e635;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #2d4a1f;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: normal;
      margin: 0;
      color: #a3e635;
      letter-spacing: 2px;
    }
    .content {
      background-color: #0a0a0a;
      border: 1px solid #2d4a1f;
      padding: 30px;
      margin-bottom: 30px;
    }
    .content p {
      line-height: 1.6;
      margin: 0 0 15px 0;
      color: #a3e635;
    }
    .button {
      display: inline-block;
      background-color: #a3e635;
      color: #000000;
      padding: 12px 30px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
      border: none;
      font-family: 'Courier New', Courier, monospace;
    }
    .button:hover {
      background-color: #84cc16;
    }
    .link {
      word-break: break-all;
      color: #65a30d;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #4d7c0f;
      margin-top: 30px;
    }
    .warning {
      color: #65a30d;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>a normal website</h1>
    </div>

    <div class="content">
      <p>someone requested a password reset for your account.</p>

      <p>if that was you, click the button below to reset your password.</p>

      <p>if not... you can safely ignore this. nothing unusual.</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          reset password
        </a>
      </center>

      <p class="warning">or copy this link into your browser:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p class="warning">this link expires in 1 hour.</p>
    </div>

    <div class="footer">
      <p>if you didn't request a password reset, someone might be trying to access your account.</p>
      <p>© 2025 a normal website. all rights reserved. probably.</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link (Optional)

**Template Name:** Magic Link

**Subject:** sign in to a normal website

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace;
      background-color: #000000;
      color: #a3e635;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #2d4a1f;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: normal;
      margin: 0;
      color: #a3e635;
      letter-spacing: 2px;
    }
    .content {
      background-color: #0a0a0a;
      border: 1px solid #2d4a1f;
      padding: 30px;
      margin-bottom: 30px;
    }
    .content p {
      line-height: 1.6;
      margin: 0 0 15px 0;
      color: #a3e635;
    }
    .button {
      display: inline-block;
      background-color: #a3e635;
      color: #000000;
      padding: 12px 30px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
      border: none;
      font-family: 'Courier New', Courier, monospace;
    }
    .button:hover {
      background-color: #84cc16;
    }
    .link {
      word-break: break-all;
      color: #65a30d;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #4d7c0f;
      margin-top: 30px;
    }
    .warning {
      color: #65a30d;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>a normal website</h1>
    </div>

    <div class="content">
      <p>you requested to sign in.</p>

      <p>click the button below to continue.</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          sign in
        </a>
      </center>

      <p class="warning">or copy this link into your browser:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p class="warning">this link expires in 1 hour.</p>
    </div>

    <div class="footer">
      <p>if you didn't request this, you can safely ignore it.</p>
      <p>© 2025 a normal website. all rights reserved. probably.</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. Change Email Address

**Template Name:** Change Email Address

**Subject:** confirm email change - a normal website

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace;
      background-color: #000000;
      color: #a3e635;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #2d4a1f;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: normal;
      margin: 0;
      color: #a3e635;
      letter-spacing: 2px;
    }
    .content {
      background-color: #0a0a0a;
      border: 1px solid #2d4a1f;
      padding: 30px;
      margin-bottom: 30px;
    }
    .content p {
      line-height: 1.6;
      margin: 0 0 15px 0;
      color: #a3e635;
    }
    .button {
      display: inline-block;
      background-color: #a3e635;
      color: #000000;
      padding: 12px 30px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
      border: none;
      font-family: 'Courier New', Courier, monospace;
    }
    .button:hover {
      background-color: #84cc16;
    }
    .link {
      word-break: break-all;
      color: #65a30d;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #4d7c0f;
      margin-top: 30px;
    }
    .warning {
      color: #65a30d;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>a normal website</h1>
    </div>

    <div class="content">
      <p>you requested to change your email address.</p>

      <p>confirm your new email address to complete the change.</p>

      <center>
        <a href="{{ .ConfirmationURL }}" class="button">
          confirm change
        </a>
      </center>

      <p class="warning">or copy this link into your browser:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p class="warning">this link expires in 24 hours.</p>
    </div>

    <div class="footer">
      <p>if you didn't request this change, contact support immediately.</p>
      <p>© 2025 a normal website. all rights reserved. probably.</p>
    </div>
  </div>
</body>
</html>
```

---

## 📋 Color Reference

The templates use your website's exact color scheme:

- **Background:** `#000000` (pure black)
- **Primary Green:** `#a3e635` (lime-500 - bright green text)
- **Button Hover:** `#84cc16` (lime-600 - slightly darker green)
- **Borders:** `#2d4a1f` (dark green)
- **Card Background:** `#0a0a0a` (very dark gray)
- **Muted Text:** `#65a30d` (lime-700 - darker green)
- **Footer Text:** `#4d7c0f` (lime-800 - darkest green)

## 🎨 Template Features

✅ **Consistent branding** - Matches website's black/green theme
✅ **Monospace font** - Courier New for that ARG/terminal feel
✅ **Responsive** - Works on mobile and desktop
✅ **Mysterious tone** - Lowercase, minimalist, slightly cryptic
✅ **Clear CTAs** - Bright green buttons stand out
✅ **Fallback links** - Plain text URLs for email clients that don't support buttons
✅ **Security messaging** - Warns about unauthorized access attempts

## 🧪 Testing

After updating in Supabase:
1. Test signup - should send styled verification email
2. Test password reset - should send styled reset email
3. Test email change in settings - should send styled confirmation

All emails should now match your website's aesthetic! 🎨
