# Node.js Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies if needed (e.g. for native modules)
# RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
