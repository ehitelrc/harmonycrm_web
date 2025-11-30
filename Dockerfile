FROM nginx:alpine-slim

WORKDIR /usr/share/nginx/html

COPY dist/harmony-frontend/browser/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]