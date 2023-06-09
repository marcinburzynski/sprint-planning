FROM node:18.16.0-bullseye as base
ARG JIRA_CLIENT_ID_ARG
ARG GOOGLE_CLIENT_ID_ARG
ENV VITE_ENV_JIRA_CLIENT_ID=$JIRA_CLIENT_ID_ARG
ENV VITE_ENV_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID_ARG

WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN corepack enable
RUN yarn install
COPY ssl /ssl


FROM base as dev
ENTRYPOINT ["bash", "-c", "yarn run dev"]


FROM base as prod-builder
COPY . /app
RUN yarn build


FROM nginx:1.23-bullseye as prod
COPY --from=prod-builder /app/dist /app
COPY --from=prod-builder /ssl /ssl

COPY privacy-policy.html /app/privacy-policy.html

RUN rm /etc/nginx/conf.d/default.conf
COPY config/nginx.conf /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]
