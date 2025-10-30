# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package manifest(s) first to take advantage of Docker cache
COPY package*.json ./



# Copy the rest of the application code
COPY . .

# Start the app
CMD ["npm", "start"]
