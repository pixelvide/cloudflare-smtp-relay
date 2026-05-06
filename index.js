const server = require('./src/smtpServer');
const { getSMTPPort, getSMTPHost } = require('./src/config');

const port = getSMTPPort();
const host = getSMTPHost();

server.listen(port, host, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 SMTP Relay Server listening on ${host}:${port}`);
  console.log(`🔒 Authentication enabled`);
  console.log(`☁️  Cloudflare HTTPS integration active`);
  console.log(`==============================================\n`);
});
