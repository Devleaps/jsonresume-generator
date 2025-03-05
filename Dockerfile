FROM node:21.5.0-alpine

ENV WORK_DIRECTORY=/tmp/jsonresume

WORKDIR /tmp/jsonresume

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    chromium \
    chromium-chromedriver \
    yq --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community \
    jq \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

COPY src/* ./

COPY entrypoint.sh ./

ENTRYPOINT ["/tmp/jsonresume/entrypoint.sh"]
