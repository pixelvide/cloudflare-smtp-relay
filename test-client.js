const nodemailer = require('nodemailer');

const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USERNAME = process.env.SMTP_USERNAME || 'example_user';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'example_password';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'sender@example.com';
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'recipient@example.com';

// Create a transporter using our local relay server
const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // since we are running locally without real certs
  }
});

async function main() {
  console.log('Sending test email to local SMTP relay...');
  try {
    const info = await transporter.sendMail({
      from: `\"My Test App\" <${SENDER_EMAIL}>`, // sender address
      to: RECIPIENT_EMAIL, // list of receivers
      subject: "Hello from Node.js", // Subject line
      text: "This is a test email sent via our custom local SMTP relay with an attachment!", // plain text body
      html: "<b>This is a test email sent via our custom local SMTP relay with an attachment!</b>", // html body
      attachments: [
        {
          filename: 'hello.txt',
          content: 'Hello, this is a test attachment forwarded via Cloudflare!'
        }
      ]
    });

    console.log("Email successfully submitted to relay!");
    console.log("Message ID: %s", info.messageId);
  } catch (error) {
    console.error("Failed to submit email to relay:");
    console.error(error.message);
  }
}

main();
