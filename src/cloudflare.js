const { getCloudflareAccountID, getCloudflareAPIToken } = require('./config');

async function sendViaCloudflare(parsedEmail, envelope) {
  const accountId = getCloudflareAccountID();
  const apiToken = getCloudflareAPIToken();

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials are not configured.');
  }

  const recipients = envelope && envelope.rcptTo ? envelope.rcptTo : parsedEmail.to.value;
  const sender = envelope && envelope.mailFrom ? envelope.mailFrom : parsedEmail.from.value[0];

  // We map each recipient to a separate API call for simplicity,
  // or we could construct a bulk payload if supported.
  const sendPromises = recipients.map(async (recipient) => {
    let cfAttachments = undefined;
    
    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      cfAttachments = parsedEmail.attachments.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment'
      }));
    }

    // Using simple string schema for 'to' and 'from' as required by the API
    // when attachments are present.
    const payload = {
      to: recipient.address,
      from: sender.address,
      subject: parsedEmail.subject || "No Subject"
    };

    if (parsedEmail.text) payload.text = parsedEmail.text;
    if (parsedEmail.html || parsedEmail.textAsHtml) payload.html = parsedEmail.html || parsedEmail.textAsHtml;
    if (cfAttachments) payload.attachments = cfAttachments;

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errMsg = `Cloudflare API error ${response.status} for recipient ${recipient.address}: ${errorText}`;
      console.error(`[Cloudflare] ${errMsg}`);
      throw new Error(errMsg);
    }
    
    return await response.json();
  });

  return await Promise.all(sendPromises);
}

module.exports = {
  sendViaCloudflare
};
