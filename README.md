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




<!-- ! -->
### NOTES ###
Quand on fait du node, RESPECTER UN ORDRE PRECIS, sans suite logique l'application ne peux marche rcorrectement 

<!-- ! J'ai un peu changé server.js et database.js par rapport au cour ! -->

https://expo.dev/accounts/robinreds-team