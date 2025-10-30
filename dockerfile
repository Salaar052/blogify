# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package manifest(s) first to take advantage of Docker cache
COPY package*.json ./

# Install dependencies (use npm ci for reproducible installs if package-lock.json exists)
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# If your app reads PORT from env, set a default
ENV PORT=3000
EXPOSE 3000

# Use a non-root user (optional but recommended)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start the app
CMD ["npm", "start"]
