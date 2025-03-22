FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV HOST=0.0.0.0

CMD [ "node", "build/index.js" ]