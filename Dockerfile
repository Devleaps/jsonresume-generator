FROM ghcr.io/puppeteer/puppeteer:24.4.0

ENV WORK_DIRECTORY=/tmp/jsonresume

WORKDIR /tmp/jsonresume

COPY src/* ./

COPY entrypoint.sh ./

USER root
RUN wget https://github.com/mikefarah/yq/releases/download/v4.45.1/yq_linux_amd64 -O /usr/bin/yq && chmod +x /usr/bin/yq
RUN apt-get install -y jq
RUN chown -R pptruser:pptruser /tmp/jsonresume

RUN npm install
RUN npm install jsonresume-theme-even
RUN npm install jsonresume-theme-eloquent


ENTRYPOINT ["/tmp/jsonresume/entrypoint.sh"]
