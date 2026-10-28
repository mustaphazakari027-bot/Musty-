# Optional container deployment. Build: docker build -t rikkos-fresh .
# Run: docker run --env-file .env -p 3000:3000 rikkos-fresh
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./
EXPOSE 3000
CMD ["npm", "start"]
