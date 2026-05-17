# Stage 1: Build Angular App
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run SSR Server (Node)
FROM node:18-alpine

WORKDIR /app

# Copy the build output
COPY --from=build /app/dist/frontend ./dist/frontend
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

EXPOSE 4200

# The command to start the SSR server
# Based on package.json: "serve:ssr:frontend": "node dist/frontend/server/server.mjs"
CMD ["node", "dist/frontend/server/server.mjs"]
