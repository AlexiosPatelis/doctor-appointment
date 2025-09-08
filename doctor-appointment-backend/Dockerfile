FROM node:20-alpine
WORKDIR /app

# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy source
COPY . .

# expose port
ENV PORT=5000
EXPOSE 5000

# run backend
CMD ["npm", "start"]
