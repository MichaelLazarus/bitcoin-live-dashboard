FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM alpine:latest
RUN apk add --no-cache nodejs npm nginx
WORKDIR /app
COPY --from=builder /app .
RUN mkdir -p /run/nginx
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf
EXPOSE 80
CMD ["sh", "-c", "nginx && node index.js"]
