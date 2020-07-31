
FROM node:12-alpine as node

RUN mkdir /www
COPY package.json /www
WORKDIR /www
RUN npm install -g @angular/cli@8.0.3
RUN npm install
WORKDIR /
COPY . /www
WORKDIR /www
RUN ng build --prod --base-href /hazmapper/
RUN ls


FROM nginx:1.17-alpine
WORKDIR /
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=node /www/dist/ /usr/share/nginx/html
