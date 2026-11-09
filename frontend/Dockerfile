FROM node:24-alpine AS development

WORKDIR /workspace/frontend/interproc-web

COPY interproc-web/package.json ./
RUN npm install

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]

FROM node:24-alpine AS build

WORKDIR /workspace/frontend/interproc-web

COPY interproc-web/package.json ./
RUN npm install
COPY interproc-web/ ./
RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /workspace/frontend/interproc-web/dist/interproc-web/browser /usr/share/nginx/html
COPY interproc-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
