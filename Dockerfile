FROM node:20-alpine AS builder
WORKDIR /app

# 1) Copy only what’s needed for install
COPY package*.json ./
RUN npm ci

# 2) Copy the rest of the source
COPY . .

# 3) Build with Vite
RUN npm run build

# ### serve with nginx ###
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 3005

ENTRYPOINT ["/entrypoint.sh"]
