FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Expose the SMTP port
EXPOSE 587

# Start the application
CMD ["pnpm", "start"]
