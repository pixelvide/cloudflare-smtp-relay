const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const { getConfig } = require('./config');
const { sendViaCloudflare } = require('./cloudflare');

const server = new SMTPServer({
  allowInsecureAuth: true,
  
  onAuth(auth, session, callback) {
    const config = getConfig();
    const userConfig = config.users && config.users[auth.username];
    
    if (!userConfig || userConfig.password !== auth.password) {
      return callback(new Error('Invalid username or password'));
    }
    
    callback(null, { user: auth.username });
  },

  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.error("[SMTP] Failed to parse email:", err);
        return callback(new Error("Failed to parse email"));
      }

      console.log(`\n--- Received Email ---`);
      console.log(`From: ${parsed.from?.text}`);
      console.log(`To: ${parsed.to?.text}`);
      console.log(`Subject: ${parsed.subject}`);

      try {
        const envelopeSender = session.envelope.mailFrom;
        const envelopeRecipients = session.envelope.rcptTo;

        if (!envelopeRecipients || envelopeRecipients.length === 0) {
           return callback(new Error("No recipient found in envelope"));
        }
        if (!envelopeSender) {
           return callback(new Error("No sender found in envelope"));
        }

        const sender = envelopeSender;
        
        // Domain/Email Validation Logic
        const config = getConfig();
        const username = session.user;
        const userConfig = config.users[username] || {};
        const globalConfig = config.global || {};

        const isAllowed = (email, allowedEmails, allowedDomains) => {
          if ((!allowedEmails || allowedEmails.length === 0) && (!allowedDomains || allowedDomains.length === 0)) {
            return true; // No restrictions
          }
          if (allowedEmails && allowedEmails.includes(email)) return true;
          if (allowedDomains) {
            const domain = email.split('@')[1];
            if (allowedDomains.includes(domain)) return true;
          }
          return false;
        };

        const allowedFromEmails = userConfig.allowed_from_emails && userConfig.allowed_from_emails.length > 0 ? userConfig.allowed_from_emails : globalConfig.allowed_from_emails;
        const allowedFromDomains = userConfig.allowed_from_domains && userConfig.allowed_from_domains.length > 0 ? userConfig.allowed_from_domains : globalConfig.allowed_from_domains;
        
        if (!isAllowed(sender.address, allowedFromEmails, allowedFromDomains)) {
          console.warn(`[SMTP] Blocked email: Sender address ${sender.address} is not allowed for user ${username}.`);
          return callback(new Error(`Sender address ${sender.address} is not allowed for this user.`));
        }
        
        const recipients = envelopeRecipients;
        const allowedToEmails = userConfig.allowed_to_emails && userConfig.allowed_to_emails.length > 0 ? userConfig.allowed_to_emails : globalConfig.allowed_to_emails;
        const allowedToDomains = userConfig.allowed_to_domains && userConfig.allowed_to_domains.length > 0 ? userConfig.allowed_to_domains : globalConfig.allowed_to_domains;

        for (const recipient of recipients) {
          if (!isAllowed(recipient.address, allowedToEmails, allowedToDomains)) {
            console.warn(`[SMTP] Blocked email: Recipient address ${recipient.address} is not allowed for user ${username}.`);
            return callback(new Error(`Recipient address ${recipient.address} is not allowed for this user.`));
          }
        }

        await sendViaCloudflare(parsed, session.envelope);
        console.log("[SMTP] Successfully forwarded email via Cloudflare!");
        callback(null);
      } catch (err) {
        console.error("[SMTP] Error during email forwarding:", err.message);
        return callback(new Error("Internal error forwarding email to Cloudflare"));
      }
    });
  }
});

server.on('error', err => {
  console.error('[SMTP] Server Error:', err.message);
});

module.exports = server;
