FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build step omitted for dev mode, we use ts-node via nodemon in dev
EXPOSE 3000

CMD ["npm", "run", "dev"]
