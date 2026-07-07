# Lancer intégralité projet 
docker compose up -d

# Initialiser MySQL en vidant le Dockercache
docker compose down && docker compose up -d

<!-- ! --------------- TESTS BACK -------------- ! -->
# Commande test backend
docker exec -it fittrack-backend npm test ✅

# Vérifier la couverture de code (Coverage)
docker exec -it fittrack-backend npm run test:coverage

# Inspecter les "Open Handles" (Optionnel mais recommandé) 
docker exec -it fittrack-backend npx jest --detectOpenHandles
<!-- ! ------------- TESTS FRONT ------------ ! -->
# Commande test frontend
docker exec -it fittrack-frontend npm run test ✅
<!-- J'ai ajouté "test": "vitest run" dans le package.json pour que la commande soit plus semblabla à backend -->

<!-- ! ------------- FIN TESTS ------------ ! -->

# Eteindre Docker
docker compose down

<!-- ? ------------- MOBILE ------------ ? -->
# Commande pour initier la partie mobile expo go
npx create-expo-app mobile --template blank-typescript

# Start mobile
npx expo start
# Si ne marche pas
REACT_NATIVE_PACKAGER_HOSTNAME=172.21.192.1 npx expo start
<!-- ? ------------- FIN MOBILE ------------ ? -->

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