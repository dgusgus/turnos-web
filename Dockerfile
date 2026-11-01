# ---- build ----
FROM node:22-alpine AS build
RUN npm install -g pnpm@10
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Las variables VITE_* se "queman" en el build: pásalas con --build-arg
ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_APP_NAME="Turnos y Citas"
ENV VITE_API_URL=$VITE_API_URL VITE_APP_NAME=$VITE_APP_NAME
RUN pnpm build

# ---- runtime ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
