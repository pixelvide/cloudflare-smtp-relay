FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Set host to 0.0.0.0 for Docker networking
ENV SMTP_HOST=0.0.0.0
ENV SMTP_PORT=587

# Expose the SMTP port
EXPOSE 587

# Start the application
CMD ["pnpm", "start"]
