# Resend Setup Guide for Email Services

This guide explains how to configure Resend email service for your authentication boilerplate.

---

## Why Resend?

- **Generous free tier**: 3,000 emails/month (permanent)
- **Easy setup**: Simple API key configuration, no app passwords needed
- **Production-ready**: Excellent deliverability and reliability
- **Developer-friendly**: Modern API designed for developers
- **Works with Nodemailer**: Drop-in replacement via SMTP

---

## Prerequisites

- A Resend account (free to sign up)
- A verified domain (optional, can use Resend's test domain for development)

---

## Step-by-Step Setup

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **Sign Up** and create your account
3. Verify your email address

---

### 2. Generate an API Key

1. Log in to your [Resend dashboard](https://resend.com/api-keys)
2. Click **Create API Key**
3. Give it a descriptive name like "Production Auth Boilerplate" or "Development"
4. Select the appropriate permission:
    - **Sending access** - Recommended for production
    - **Full access** - Only if you need additional permissions
5. Click **Create**
6. **Copy the API key immediately** - you won't be able to see it again!
    - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 3. Add the API Key to Your Environment Variables

Add the API key to your `.env` file:

```properties
# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Keep this API key secret and never commit it to version control!

---

### 4. Verify Your Domain (Optional but Recommended)

For production use, you should verify your own domain:

1. Go to [Resend Domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain name (e.g., `yourdomain.com`)
4. Add the provided DNS records (SPF, DKIM, DMARC) to your domain's DNS settings
5. Wait for DNS propagation (can take up to 48 hours, usually much faster)
6. Click **Verify DNS Records**

**For development/testing:** You can use Resend's default domain `onboarding@resend.dev` without verification.

---

### 5. Update the "From" Email Address (Optional)

If you verified your domain, update the `from` address in `server/src/features/email/sendEmail.ts`:

```typescript
const mailOptions = {
    from: "noreply@yourdomain.com", // Replace with your verified domain
    to,
    subject,
    html,
};
```

**Common "from" addresses:**

- `noreply@yourdomain.com` - For transactional emails
- `hello@yourdomain.com` - For welcoming emails
- `support@yourdomain.com` - For support-related emails

---

## Testing Your Setup

### 1. Start the Development Server

```bash
cd server && npm run dev
```

### 2. Test Email Verification Flow

1. Register a new user account through your application
2. Check the email inbox for the verification email
3. Verify that the email is delivered successfully

**Note:** In development mode (`NODE_ENV=development`), emails are logged to console instead of being sent.

---

## Troubleshooting

### Email not being sent

**Check your .env file:**

- Ensure `RESEND_API_KEY` is set correctly
- Verify there are no extra spaces or quotes

**Check your NODE_ENV:**

- In development mode, emails are only logged to console
- Set `NODE_ENV=production` to actually send emails

**Check Resend dashboard:**

- Go to [Resend Logs](https://resend.com/emails) to see email delivery status
- Check for any error messages

### "From" address not verified

**Error:** `Error: The 'from' email address is not verified`

**Solution:**

- Use Resend's test domain: `onboarding@resend.dev`
- Or verify your custom domain following step 4 above

### Free tier limits reached

**Free tier limits:**

- 3,000 emails/month
- 100 emails/day

**Solution:**

- Monitor your usage in the [Resend dashboard](https://resend.com/overview)
- Upgrade to a paid plan if needed ($20/month for 50,000 emails)

---

## Resend vs Gmail Comparison

| Feature              | Resend                         | Gmail                                   |
| -------------------- | ------------------------------ | --------------------------------------- |
| **Free tier**        | 3,000 emails/month (permanent) | ~500 emails/day (not designed for apps) |
| **Setup complexity** | Simple API key                 | Requires 2FA + app password             |
| **Production ready** | ✅ Yes                         | ❌ Not recommended                      |
| **Deliverability**   | Excellent                      | Good (but Gmail may block)              |
| **Custom domains**   | ✅ Supported                   | ❌ Not supported                        |
| **Email tracking**   | ✅ Dashboard with logs         | ❌ No tracking                          |
| **Paid plans**       | $20/month for 50k emails       | Not available                           |

---

## Best Practices

### 1. Use Environment-Specific API Keys

Create separate API keys for development and production:

```bash
# Development .env
RESEND_API_KEY=re_dev_xxxxxxxxxx

# Production .env
RESEND_API_KEY=re_prod_xxxxxxxxxx
```

### 2. Monitor Email Deliverability

- Check [Resend dashboard](https://resend.com/emails) regularly
- Set up domain authentication (SPF, DKIM, DMARC)
- Monitor bounce and spam rates

### 3. Implement Email Queues (Future Enhancement)

For high-volume applications, consider using a queue system:

- Bull (Redis-based queue)
- AWS SQS
- RabbitMQ

This prevents email sending from blocking API responses.

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Resend SMTP Configuration](https://resend.com/docs/send-with-nodemailer-smtp)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

---

## Support

If you encounter issues:

1. Check the [Resend status page](https://resend.instatus.com/)
2. Review [Resend documentation](https://resend.com/docs)
3. Contact Resend support via their dashboard
4. Check your application logs for error messages
