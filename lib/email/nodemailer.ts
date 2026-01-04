import nodemailer from "nodemailer"
import { logger } from "@/lib/utils/logger"
import { google } from "googleapis"

// Create OAuth2 client for Gmail (if OAuth credentials are provided)
const createOAuth2Client = () => {
  if (
    !process.env.GMAIL_CLIENT_ID ||
    !process.env.GMAIL_CLIENT_SECRET ||
    !process.env.GMAIL_REFRESH_TOKEN
  ) {
    return null
  }

  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })

  return oauth2Client
}

// Create reusable transporter (supports both OAuth2 and App Password)
const createTransporter = async () => {
  // Method 1: Try OAuth2 first (more secure)
  const oauth2Client = createOAuth2Client()
  if (oauth2Client && process.env.SMTP_USER) {
    try {
      const accessToken = await oauth2Client.getAccessToken()

      if (accessToken.token) {
        logger.info("Using Gmail OAuth2 authentication")
        return nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.SMTP_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token,
          },
        })
      }
    } catch (error) {
      logger.warn("OAuth2 authentication failed, falling back to app password", error)
    }
  }

  // Method 2: Fallback to App Password (legacy method)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP configuration is missing. Email functionality will be disabled.")
    return null
  }

  logger.info("Using SMTP app password authentication")
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Gmail App Password
    },
  })
}

// Initialize transporter (async)
let transporter: Awaited<ReturnType<typeof createTransporter>> = null
const initTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter()
  }
  return transporter
}

export async function sendLoanReminderToBorrower(
  borrowerEmail: string,
  borrowerName: string,
  lenderName: string,
  loanAmount: number,
  dueDate: string,
  loanId: string
) {
  const emailTransporter = await initTransporter()

  if (!emailTransporter) {
    logger.warn("Email transporter not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: borrowerEmail,
      subject: `Loan Reminder: ₹${loanAmount.toLocaleString("en-IN")} due on ${new Date(dueDate).toLocaleDateString("en-IN")}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loan Reminder</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Loan Reminder</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${borrowerName}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                This is a friendly reminder that you have a loan of <strong>₹${loanAmount.toLocaleString("en-IN")}</strong> 
                that is due on <strong>${new Date(dueDate).toLocaleDateString("en-IN", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}</strong>.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                This loan was provided by <strong>${lenderName}</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Loan Details:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 18px; color: #333;">
                  Amount: <strong style="color: #667eea;">₹${loanAmount.toLocaleString("en-IN")}</strong>
                </p>
                <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
                  Due Date: ${new Date(dueDate).toLocaleDateString("en-IN", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>
              
              <p style="font-size: 16px; margin-top: 30px;">
                Please ensure the payment is made on or before the due date.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                This is an automated reminder from Budget 2025
              </p>
            </div>
          </body>
        </html>
      `,
    })

    logger.info("Email sent successfully to borrower", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    logger.error("Error sending email to borrower", error)
    return { success: false, error: error.message }
  }
}

export async function sendLoanReminderToLender(
  lenderEmail: string,
  lenderName: string,
  borrowerName: string,
  loanAmount: number,
  dueDate: string,
  loanId: string
) {
  const emailTransporter = await initTransporter()

  if (!emailTransporter) {
    logger.warn("Email transporter not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: lenderEmail,
      subject: `Loan Reminder: ₹${loanAmount.toLocaleString("en-IN")} from ${borrowerName} due on ${new Date(dueDate).toLocaleDateString("en-IN")}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loan Reminder</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Loan Reminder</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${lenderName}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                This is a reminder that you have a loan of <strong>₹${loanAmount.toLocaleString("en-IN")}</strong> 
                given to <strong>${borrowerName}</strong> that is due on 
                <strong>${new Date(dueDate).toLocaleDateString("en-IN", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Loan Details:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 18px; color: #333;">
                  Amount: <strong style="color: #667eea;">₹${loanAmount.toLocaleString("en-IN")}</strong>
                </p>
                <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
                  Borrower: ${borrowerName}
                </p>
                <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
                  Due Date: ${new Date(dueDate).toLocaleDateString("en-IN", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
              </div>
              
              <p style="font-size: 16px; margin-top: 30px;">
                You may want to follow up with ${borrowerName} regarding this loan.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                This is an automated reminder from Budget 2025
              </p>
            </div>
          </body>
        </html>
      `,
    })

    logger.info("Email sent successfully to lender", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    logger.error("Error sending email to lender", error)
    return { success: false, error: error.message }
  }
}

