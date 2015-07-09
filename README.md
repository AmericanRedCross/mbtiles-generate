# mbtiles-generate

- install MongoDB
- start a database process storing in the data folder in the project folder:  
  `mongod --dbpath /path/mbtiles-generate/data`
- restore the database containing the default login:    
  `mongorestore -d mbtiles-generate /path/mmbtiles-generate/data/dump/mbtiles-generate`
- should output something like the following:    

```
» mongorestore -d mbtiles-generate /path/mbtiles-generate/data/dump/mbtiles-generate
2015-07-09T15:18:54.188-0400	building a list of collections to restore from /path/mbtiles-generate/data/dump/mbtiles-generate dir
2015-07-09T15:18:54.189-0400	reading metadata file from /path/mbtiles-generate/data/dump/mbtiles-generate/users.metadata.json
2015-07-09T15:18:54.190-0400	restoring mbtiles-generate.users from file /path/mbtiles-generate/data/dump/mbtiles-generate/users.bson
2015-07-09T15:18:54.190-0400	restoring indexes for collection mbtiles-generate.users from metadata
2015-07-09T15:18:54.191-0400	finished restoring mbtiles-generate.users
2015-07-09T15:18:54.191-0400	done
```
- start the app: `node server.js`
- go to localhost:8888
- login with...
  - username: test@default.com
  - password: pass
