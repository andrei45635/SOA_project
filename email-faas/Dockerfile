#FROM node:20-alpine AS builder
#
#WORKDIR /app
#
#COPY package*.json ./
#
#RUN npm ci
#
#COPY . .
#
#RUN npm run build
#
#FROM node:20-alpine
#
#WORKDIR /app
#
#COPY package*.json ./
#
#RUN npm ci --only=production
#
#COPY --from=builder /app/dist ./dist
#
#RUN addgroup -g 1001 -S nodejs && \
#    adduser -S nodejs -u 1001
#
#USER nodejs
#
#CMD ["node", "dist/index.js"]


FROM node:20-alpine

RUN apk add --no-cache curl

RUN curl -sSL https://github.com/openfaas/of-watchdog/releases/download/0.9.15/of-watchdog-amd64 -o /usr/bin/fwatchdog \
    && chmod +x /usr/bin/fwatchdog

WORKDIR /home/app

COPY function/package*.json ./
RUN npm ci --only=production

COPY function/handler.js ./

RUN addgroup -g 1000 -S app && \
    adduser -u 1000 -S app -G app && \
    chown -R app:app /home/app

USER app

ENV mode="http"
ENV fprocess="node handler.js"
ENV upstream_url="http://127.0.0.1:3000"
ENV exec_timeout="30s"
ENV write_timeout="30s"
ENV read_timeout="30s"

HEALTHCHECK --interval=5s CMD [ -e /tmp/.lock ] || exit 1

EXPOSE 8080

CMD ["fwatchdog"]