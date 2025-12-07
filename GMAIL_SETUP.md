# Gmail App Password Setup Instructions

This guide will help you set up a Gmail App Password for sending email reminders in Budget 2025.

## Step-by-Step Instructions

### 1. Enable 2-Step Verification

Before you can create an App Password, you need to enable 2-Step Verification on your Google account:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - Google will send you a verification code

### 2. Generate App Password

Once 2-Step Verification is enabled:

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
   - If you don't see this option, make sure 2-Step Verification is enabled
3. You may be asked to sign in again
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter a name like "Budget 2025" or "Email Reminders"
7. Click **Generate**
8. **Copy the 16-character password** that appears
   - It will look like: `abcd efgh ijkl mnop`
   - Remove the spaces when using it: `abcdefghijklmnop`
   - ⚠️ **Important**: You can only see this password once! Save it immediately.

### 3. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=Budget 2025 <your-email@gmail.com>

# Optional: For cron job security
CRON_SECRET_TOKEN=your-secret-token-here
```

**Important Notes:**
- `SMTP_USER`: Your Gmail address (e.g., `yourname@gmail.com`)
- `SMTP_PASS`: The 16-character App Password you generated (without spaces)
- `SMTP_FROM`: The "From" name and email that recipients will see
- `SMTP_SECURE`: Set to `false` for port 587 (TLS), or `true` for port 465 (SSL)

### 4. Test Your Configuration

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

The email service will automatically use these credentials when sending loan reminders.

## Troubleshooting

### "Less secure app access" error
- Google no longer supports "less secure apps"
- You **must** use an App Password (not your regular Gmail password)
- Make sure 2-Step Verification is enabled

### "Authentication failed" error
- Double-check that you copied the App Password correctly (no spaces)
- Make sure 2-Step Verification is enabled
- Try generating a new App Password

### "Connection timeout" error
- Check your firewall settings
- Make sure port 587 (or 465) is not blocked
- Try using port 465 with `SMTP_SECURE=true`

### Emails going to spam
- Make sure `SMTP_FROM` includes a proper name
- Consider setting up SPF/DKIM records for your domain (advanced)
- For now, emails will be sent from your Gmail address

## Alternative: Using Other Email Providers

You can also use other SMTP providers:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Security Best Practices

1. **Never commit your `.env.local` file to Git**
2. **Keep your App Password secure** - treat it like your account password
3. **Rotate App Passwords periodically** - generate new ones every few months
4. **Use environment variables** in production (Vercel, Railway, etc.)
5. **Set up a CRON_SECRET_TOKEN** to protect your cron endpoint

## Setting Up Cron Job

To automatically send loan reminders, you need to set up a cron job that calls:

```
GET https://your-domain.com/api/cron/loan-reminders
Authorization: Bearer YOUR_CRON_SECRET_TOKEN
```

### Using Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/loan-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### Using GitHub Actions

Create `.github/workflows/loan-reminders.yml`:
```yaml
name: Loan Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X GET https://your-domain.com/api/cron/loan-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
```

### Using External Cron Services

- [cron-job.org](https://cron-job.org) - Free cron service
- [EasyCron](https://www.easycron.com) - Reliable cron service
- [Uptime Robot](https://uptimerobot.com) - Monitoring with cron

Set the schedule to run daily (e.g., 9 AM UTC) and include the Authorization header.

