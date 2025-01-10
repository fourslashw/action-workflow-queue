# --- base stage --- #

FROM alpine:3.20 AS base

# hadolint ignore=DL3018
RUN apk add --no-cache --update \
  nodejs \
  git \
  openssh \
  ca-certificates \
  ruby-bundler \
  bash

WORKDIR /action

# --- build stage --- #

FROM base AS build

# hadolint ignore=DL3018
RUN apk add --no-cache npm

# slience npm
# hadolint ignore=DL3059
RUN npm config set update-notifier=false audit=false fund=false

# install packages
COPY package* ./
RUN npm ci --omit=dev --no-fund --no-audit

# --- app stage --- #

FROM base AS app

# copy from build image
COPY --from=build /action/node_modules ./node_modules

# copy files
COPY package.json src ./

WORKDIR /github/workspace/

# hadolint ignore=DL3002
USER root

HEALTHCHECK NONE

ENTRYPOINT ["node", "/action/index.js"]
