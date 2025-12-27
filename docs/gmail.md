# Gmail Setup Guide for Nodemailer

This guide explains how to configure Gmail to work with Nodemailer using App Passwords.

---

## Prerequisites

- A Gmail account
- Two-factor authentication (2FA) must be enabled on your Google account

---

## Step-by-Step Setup

### 1. Enable Two-Factor Authentication (if not already enabled)

1. Go to your [Google Account Security page](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on **2-Step Verification**
3. Follow the prompts to enable 2FA using your phone number or authenticator app

---

### 2. Generate an App Password

1. Go to your [Google Account Security page](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on **2-Step Verification**
3. Scroll down to the bottom and click on **App passwords**
    - If you don't see this option, make sure 2FA is fully enabled and wait a few minutes
4. You may need to sign in again
5. In the "Select app" dropdown, choose **Mail**
6. In the "Select device" dropdown, choose **Other (Custom name)**
7. Enter a name like "Nodemailer App" or "My Boilerplate Project"
8. Click **Generate**
9. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
10. **Copy this password immediately** - you won't be able to see it again!

---

### 3. Add the App Password to Your Environment Variables

Add the generated app password to your `.env` file:

```properties
# Gmail Configuration
GMAIL_USER=your.email@gmail.com
GMAIL_PWD=abcdefghijklmnop  # Remove spaces from the generated password
```

**Important:** Remove all spaces from the 16-character password when adding it to your `.env` file.

---

## Troubleshooting

### Gmail daily sending limits

- Free Gmail accounts: ~500 emails/day
- Google Workspace: ~2,000 emails/day
- For higher volumes, use a dedicated email service
