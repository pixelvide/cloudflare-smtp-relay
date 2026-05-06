# Cloudflare SMTP Relay

A robust, modular Node.js SMTP relay server designed to receive standard SMTP connections and forward emails seamlessly via the Cloudflare REST API. 

## Features

- **Cloudflare API Integration:** Forwards emails reliably using Cloudflare's infrastructure.
- **Attachment Support:** Built-in processing for handling and forwarding email attachments.
- **Dynamic Configuration:** Uses a YAML-based configuration (`config.yml`) that auto-refreshes in memory without requiring a server restart.
- **Granular Security & Authentication:** Multi-user support with domain and email-level restriction controls for both incoming and outgoing addresses.
- **Container-Ready:** Fully Dockerized setup (`Dockerfile` & `docker-compose.yml`) for easy production deployment.
- **Clean Architecture:** Modular structure separating SMTP handling, configuration management, and API communication.

## Prerequisites

- **Node.js** (v18+ recommended)
- **pnpm** (Package manager)
- **Docker & Docker Compose** (Optional, for containerized deployments)
- A **Cloudflare Account** with an active API Token and Account ID setup for email routing.

## Installation

1. **Clone the repository** (if you haven't already).
2. **Install dependencies** using `pnpm`:
   ```bash
   pnpm install
   ```
3. **Set up configuration:**
   Copy the example configuration file:
   ```bash
   cp config.example.yml config.yml
   ```
4. **Edit `config.yml`:**
   Add your Cloudflare credentials (`cloudflare_account_id` and `cloudflare_api_token`) and define your SMTP users and restrictions.

*(Note: `config.yml` and `.env` are automatically ignored by Git to keep your sensitive information safe.)*

## Usage

### Running Locally

Start the SMTP relay server:
```bash
pnpm start
```
By default, the server listens on port `587` (or as defined in your config).

### Running with Docker

To deploy the application using Docker Compose:

1. Ensure your `config.yml` is correctly set up in the root directory.
2. Run Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

## Testing

A built-in test client is provided to verify your setup. It uses `nodemailer` to send a test email with an attachment through your local SMTP relay.

To run the test client:
```bash
node test-client.js
```
*(You may need to provide environment variables or edit `test-client.js` defaults to match the user credentials configured in your `config.yml`.)*

## Project Structure

- `index.js`: Main entry point.
- `src/smtpServer.js`: Core SMTP server implementation and email parsing (`smtp-server`, `mailparser`).
- `src/config.js`: Configuration manager for hot-reloading YAML settings.
- `config.example.yml`: Example configuration template.
- `test-client.js`: Nodemailer script for end-to-end testing.
- `Dockerfile` & `docker-compose.yml`: Containerization files.
