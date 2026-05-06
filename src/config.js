const fs = require('fs');
const yaml = require('yaml');

// Use SMTP_RELAY_CONFIG_PATH from environment if present, otherwise default to ./config.yml
const CONFIG_PATH = process.env.SMTP_RELAY_CONFIG_PATH || './config.yml';

let loadedConfig = { global: {}, users: {} };
let reloadIntervalId = null;

function loadConfig() {
  try {
    const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = yaml.parse(fileContents);
    if (parsed) {
      loadedConfig = {
        global: parsed.global || {},
        users: {}
      };
      if (Array.isArray(parsed.smtp_users)) {
        parsed.smtp_users.forEach(u => {
          if (u.username) {
            loadedConfig.users[u.username] = u;
          }
        });
      }
      console.log(`[Config] Successfully loaded configuration from ${CONFIG_PATH}`);

      // Handle dynamic reload interval
      const intervalMs = loadedConfig.global.config_refresh_interval_ms;
      if (intervalMs && typeof intervalMs === 'number' && intervalMs > 0) {
        // If the interval changed, update it
        if (reloadIntervalId) {
          clearInterval(reloadIntervalId);
        }
        reloadIntervalId = setInterval(loadConfig, intervalMs);
      } else if (reloadIntervalId) {
        // Interval set to 0 or removed, so stop reloading
        clearInterval(reloadIntervalId);
        reloadIntervalId = null;
        console.log(`[Config] Automatic configuration reload disabled.`);
      }
    }
  } catch (e) {
    console.warn(`[Config] WARNING: Could not load configuration from ${CONFIG_PATH}. Error: ${e.message}`);
  }
}

// Initial load
loadConfig();

module.exports = {
  getSMTPPort: () => loadedConfig.global.smtp_port || 587,
  getSMTPHost: () => loadedConfig.global.smtp_host || '127.0.0.1',
  getCloudflareAccountID: () => loadedConfig.global.cloudflare_account_id,
  getCloudflareAPIToken: () => loadedConfig.global.cloudflare_api_token,
  getConfig: () => loadedConfig
};
