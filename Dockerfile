# Frontend Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontend-benin-explo /tmp/dist
RUN if [ -d /tmp/dist/browser ]; then cp -R /tmp/dist/browser/. /usr/share/nginx/html/; else cp -R /tmp/dist/. /usr/share/nginx/html/; fi
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]