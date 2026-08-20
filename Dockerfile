# Use the node:20.5.1-bookworm-slim image as the base image
FROM node:20.5.1-bookworm-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and pnpm lockfile from the host to the container's working directory
COPY package.json pnpm-lock.yaml ./

# Enable pnpm and install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the application code from the host to the container's working directory
COPY . .

# Install Chrome browser for use with Playwright
RUN pnpm exec playwright install chrome

# Here, we run the test script defined in package.json (pnpm run test:serial)
CMD ["pnpm", "run", "test:serial"]