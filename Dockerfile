FROM node:20-alpine as dev

WORKDIR /usr/src/app

COPY package*.json .

RUN npm i

# Copy the rest of the source files into the image.
COPY . .

RUN npm run build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["node", "dist/index.js"]
