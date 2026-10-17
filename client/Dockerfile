# Pull the official Node.js base image (Alpine for smaller size)
FROM node:24-alpine AS development

# Set environment to development
ENV NODE_ENV=development

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Install dependencies (uses cache for faster rebuilds)
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the development port (usually 3001 for Next.js, but you used 3100)
EXPOSE 3001

# Start the Next.js development server
CMD ["npm", "run", "dev"]
