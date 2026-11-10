FROM node:24-alpine AS development

WORKDIR /workspace/frontend/interproc-web

COPY frontend/interproc-web/package.json frontend/interproc-web/package-lock.json ./
RUN npm ci

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000", "--proxy-config", "proxy.conf.json"]

FROM development AS test

COPY frontend/interproc-web/ ./
RUN npm test

FROM node:24-alpine AS build

WORKDIR /workspace/frontend/interproc-web

COPY frontend/interproc-web/package.json frontend/interproc-web/package-lock.json ./
RUN npm ci
COPY frontend/interproc-web/ ./
RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /workspace/frontend/interproc-web/dist/interproc-web/browser /usr/share/nginx/html
COPY frontend/interproc-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
