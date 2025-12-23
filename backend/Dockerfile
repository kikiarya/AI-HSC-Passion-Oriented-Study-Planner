# --- Build/Runtime 都使用 Node 20 ---
FROM node:20-alpine

WORKDIR /app

# 先复制包清单，利用缓存
COPY package*.json ./

# 生产环境只装生产依赖（如果你的服务器端需要 devDeps，就删掉 --omit=dev）
RUN npm ci --omit=dev

# 再复制源码
COPY . .

# 设置环境变量（可被 compose 覆盖）
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 生产环境不要用 nodemon
CMD ["node", "server.js"]
# --- Build/Runtime 都使用 Node 20 ---
FROM node:20-alpine

WORKDIR /app

# 先复制包清单，利用缓存
COPY package*.json ./

# 生产环境只装生产依赖（如果你的服务器端需要 devDeps，就删掉 --omit=dev）
RUN npm ci --omit=dev

# 再复制源码
COPY . .

# 设置环境变量（可被 compose 覆盖）
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 生产环境不要用 nodemon
CMD ["node", "server.js"]
# --- Build/Runtime 都使用 Node 20 ---
FROM node:20-alpine

WORKDIR /app

# 先复制包清单，利用缓存
COPY package*.json ./

# 生产环境只装生产依赖（如果你的服务器端需要 devDeps，就删掉 --omit=dev）
RUN npm ci --omit=dev

# 再复制源码
COPY . .

# 设置环境变量（可被 compose 覆盖）
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 生产环境不要用 nodemon
CMD ["node", "server.js"]
