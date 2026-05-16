FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

# Create uploads directory
RUN mkdir -p uploads

CMD ["npm", "run", "dev"]
