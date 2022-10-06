# chatnow - Technologie-Stack
1. Node.js
3. DB: PostgresSQL
4. ORM: Sequelize
5. http/Express
6. Socket.io
7. React v18
8. MaterialUI (mui.com) v4.x

# chatnow - Installationsanleitung
## 1 - Postgres Datenbank im Docker installieren und starten
```
docker run --name dirk-postgres -e POSTGRES_PASSWORD=dirk123 -p 5432:5432 -d postgres
```

## 2 - Repository-Checkout (oder Zip-Download) per GitHUB
GitHUB: https://github.com/Delphibase/chatnow

Repository-URL:
```
https://github.com/Delphibase/chatnow.git
```

## 3 - NPM-Pakete installieren
### Client-NPM Pakete installieren
Im Projektverzeichnis vom Root-Ordner aus in den Ordner ```./client``` wechseln

```
npm install --legacy-peer-deps
```

### Server-NPM Pakete installieren
Im Projektverzeichnis vom Root-Ordner aus in den Ordner ```./server``` wechseln

```
npm install
```

## 4 - Projekt starten und anwenden
Der Chat läuft in der Developmennt-Umgebung. Das bedeutet, dass der React-Client seinen eigenen Development-Server hat und das Backend (mit DB-Connection) ein sep. Server ist.
Eine Vereinigung wäre der nächste konsequente Schritt.

### REACT-Client starten
Im Projektverzeichnis vom Root-Ordner aus in den Ordner ```./client``` wechseln

Befehl ``` npm start ``` ausführen

### Server (inkl. Socket + DB Connection) starten
Im Projektverzeichnis vom Root-Ordner aus in den Ordner ```./server``` wechseln

Befehl ``` npm start ``` ausführen

## 5- Am Chat-Client anmelden
Im Browser ```http://localhost:3000``` öffnen und mit belibigem Nichname anmelden.

Hier ergänzend noch ein Sneak-Peak Video: https://hidrive.ionos.com/lnk/xy1ruzpq


