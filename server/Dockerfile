FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p data uploads/champions uploads/items
ENV PORT=3002
EXPOSE 3002
CMD ["node", "index.js"]
