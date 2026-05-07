const { getCloudflareAccountID, getCloudflareAPIToken } = require('./config');

async function sendViaCloudflare(parsedEmail, envelope) {
  const accountId = getCloudflareAccountID();
  const apiToken = getCloudflareAPIToken();

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials are not configured.');
  }

  const sender = envelope && envelope.mailFrom ? envelope.mailFrom : parsedEmail.from.value[0];

  const toAddresses = parsedEmail.to?.value?.map(v => v.address) || [];
  const ccAddresses = parsedEmail.cc?.value?.map(v => v.address) || [];
  const bccAddresses = parsedEmail.bcc?.value?.map(v => v.address) || [];

  // Fallback to envelope recipients if To is empty, Bcc recipients not in headers will also be added to Bcc
  const envelopeAddresses = envelope && envelope.rcptTo ? envelope.rcptTo.map(r => r.address) : [];
  
  if (toAddresses.length === 0 && envelopeAddresses.length > 0) {
    toAddresses.push(envelopeAddresses[0]);
  }

  // Any envelope recipients not in To, Cc, or Bcc headers should be added to Bcc
  const headerAddresses = new Set([...toAddresses, ...ccAddresses, ...bccAddresses]);
  const hiddenBccAddresses = envelopeAddresses.filter(addr => !headerAddresses.has(addr));
  
  const finalBcc = [...bccAddresses, ...hiddenBccAddresses];

  let cfAttachments = undefined;
  
  if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
    cfAttachments = parsedEmail.attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType,
      disposition: 'attachment'
    }));
  }

  const payload = {
    from: sender.address,
    subject: parsedEmail.subject || "No Subject"
  };

  // Assign to, cc, bcc. Using arrays of strings as supported by Cloudflare.
  // For 'to', if it's a single address, we pass it as a string to be safe, otherwise an array.
  if (toAddresses.length > 0) payload.to = toAddresses.length === 1 ? toAddresses[0] : toAddresses;
  if (ccAddresses.length > 0) payload.cc = ccAddresses;
  if (finalBcc.length > 0) payload.bcc = finalBcc;

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
    const errMsg = `Cloudflare API error ${response.status}: ${errorText}`;
    console.error(`[Cloudflare] ${errMsg}`);
    throw new Error(errMsg);
  }
  
  return await response.json();
}

module.exports = {
  sendViaCloudflare
};
