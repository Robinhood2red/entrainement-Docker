# Lancer intégralité projet 
docker compose up -d

# Initialiser MySQL en vidant le Dockercache
docker compose down -v && docker compose up -d

# Eteindre Docker
docker compose down

# Le Site Web (React)	
http://localhost

# L'interface phpMyAdmin
http://localhost:8081

# L'API Backend (Node.js)	
http://localhost:5000/api