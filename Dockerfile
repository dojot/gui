FROM node:10.23.0-alpine3.10 AS basis

RUN mkdir /data
WORKDIR /data

#Set the GUI version
ARG DOJOT_VERSION='undefined'

#It is used to define the API URL
ARG BASE_URL=''

#It is used to define the Application URL
ARG APPLICATION_URL='/'


ENV GUI_VERSION=${DOJOT_VERSION}
ENV BASE_URL=${BASE_URL}
ENV APPLICATION_URL=${APPLICATION_URL}

COPY . .
RUN yarn install --frozen-lockfile && npm rebuild node-sass && yarn run build

FROM nginx:1.15.7-alpine

COPY --from=basis /data/dist /usr/share/nginx/html
COPY --from=basis /data/locales /usr/share/nginx/html/locales

EXPOSE 80
