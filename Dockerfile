FROM node:14.19.1-alpine3.15 as node

RUN mkdir /www
COPY package.json /www
COPY . /www
WORKDIR /www
RUN npm install -g @angular/cli@8.3.22
RUN npm install
# WORKDIR /
# COPY . /www
# WORKDIR /www
# RUN ng build --prod --base-href /taggit/
RUN ng build --prod
# RUN ls


FROM nginx:1.17-alpine
WORKDIR /
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=node /www/dist/ /usr/share/nginx/html
