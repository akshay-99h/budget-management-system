import nodemailer from "nodemailer"
import { logger } from "@/lib/utils/logger"

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP configuration is missing. Email functionality will be disabled.")
    return null
  }

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

const transporter = createTransporter()

export async function sendLoanReminderToBorrower(
  borrowerEmail: string,
  borrowerName: string,
  lenderName: string,
  loanAmount: number,
  dueDate: string,
  loanId: string
) {
  if (!transporter) {
    logger.warn("Email transporter not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const info = await transporter.sendMail({
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
  if (!transporter) {
    logger.warn("Email transporter not configured. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const info = await transporter.sendMail({
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

