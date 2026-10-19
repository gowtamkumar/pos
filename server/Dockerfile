FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=development

# bcrypt can compile locally if a prebuilt binary is unavailable.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
EXPOSE 3900
CMD ["npm", "run", "start:dev"]
