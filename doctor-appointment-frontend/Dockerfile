# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci

# copy source
COPY . .

# build app (API base comes from docker-compose ARG)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# --- Serve Stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
