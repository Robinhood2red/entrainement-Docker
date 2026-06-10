FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
# Même stratégie de cache que le backend

RUN npm install
# Installe React, Vite, TypeScript, Tailwind, Axios, Recharts...
# Ces dépendances font ~300Mo → le cache est crucial

COPY . .
# Copie le code source React

EXPOSE 3000
# Port du serveur de développement Vite

CMD ["npm", "run", "dev"]
# Lance Vite en mode développement
# Vite détectera les changements via le volume monté dans docker-compose.yml
# et rafraîchira le navigateur automatiquement (HMR)