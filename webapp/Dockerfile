FROM node:16-alpine AS client

WORKDIR /app

COPY webapp /app

RUN npm run build

EXPOSE 3000

RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]