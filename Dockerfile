FROM nginx:alpine-slim

WORKDIR /usr/share/nginx/html

COPY dist/harmony-frontend/browser/ .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]