# Use an official lightweight Node.js image
FROM node:22-alpine

# Install Docker CLI so Node.js can trigger GCC containers
RUN apk add --no-cache docker-cli

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of your application code
COPY . .

# Expose the Express port
EXPOSE 3000

# Command to run the server
CMD ["npm", "start"]