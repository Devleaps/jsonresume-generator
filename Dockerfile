FROM node:21.5.0-alpine

ENV WORK_DIRECTORY=/tmp/jsonresume

WORKDIR /tmp/jsonresume

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN apk update \
    && apk upgrade \
    && apk add --no-cache \
    chromium \
    yq --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community \
    jq

COPY src/* ./

COPY entrypoint.sh ./

ENTRYPOINT ["/tmp/jsonresume/entrypoint.sh"]
