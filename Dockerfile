FROM node:20-alpine AS builder
WORKDIR /app

# 1) Copy only what’s needed for install
COPY package*.json ./
RUN npm ci

# 2) Copy your env, then the rest of the source
COPY .env.production .env
COPY . .

# 3) Build with Vite (it sees .env, .env.production)
RUN npm run build

# ### serve with nginx ###
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
