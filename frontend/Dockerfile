# ---------- 构建阶段 ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig*.json vite.config.* index.html postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
# 构建必须零错误：tsc -b 先做类型检查，再由 vite 打包
RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# 关键：宿主 umask 会把新文件建成 0600，nginx worker(非 root) 读不到 → 403 + console error
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
