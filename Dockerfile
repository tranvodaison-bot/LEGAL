FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* .npmrc ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
