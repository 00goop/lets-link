FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "run", "start"]
