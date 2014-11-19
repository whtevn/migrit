 function(action, loc, toVersion){
		var connection, timestamp, filename, content, dbVersion, migrationVersion, migration,done
			thisGrunt = this;
			if(loc && loc.match(/^\d*$/)){
				toVersion = loc;
				loc = undefined;
			}

			connection = mysql.createConnection(deploy.target[loc||'local'].db);
			connection.connect();
			done = this.async();
			fileList = grunt.file.expand({filter: 'isFile'}, "./etc/migrations/*.json");

			dbVersion = Q.ninvoke(connection, 'query', 'SELECT version FROM database_state ORDER BY modifiedAt DESC LIMIT 1')
				.then(function(rows, fields){
					return rows[0][0].version;
				})
				.fail(function(err){
					if(err.code=="ER_NO_SUCH_TABLE"){
						return Q.ninvoke(connection, 'query', 'CREATE TABLE database_state (version varchar(255) NOT NULL, modifiedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)')
						.then(function(){
							return Q.ninvoke(connection, 'query', 'INSERT INTO database_state(version) VALUES(-1)')
						})
						.then(function(){
							return -1
						})
					}else{
						throw err
					}
				})
		switch(action){
			case 'down':
				dbVersion.then(function(dbVersionVal){
					fileList.sort(orderMigrations).reverse();
					toVersion = (toVersion || -1);
					chainSql(fileList, done, thisGrunt, function(migrationVersion, migration){
						if(migrationVersion > toVersion){
							if(+(dbVersionVal) >= migrationVersion){
								return runQueryArray(migration.down, thisGrunt)
									.then(function(rows){
										console.log("undoing: "+migration.description);
										currentVersion = fileList[0]?+(fileList[0].match(/\/(\d*)_.*\.json$/)[1]):-1;
										return Q.ninvoke(connection, 'query', "UPDATE database_state SET version='"+currentVersion+"', modifiedAt=NOW()")
											.then(function(){
												console.log("...success");
											});
									})
							}else{
								deferred = Q.defer();
								deferred.resolve();
								console.log("moving past: "+migration.description);
								return deferred.promise
							}
						}else{
							deferred = Q.defer();
							deferred.resolve();
							console.log("complete");
							done();
							return deferred.promise
						}
					});
				});
				break;
			case 'up':
				dbVersion.then(function(dbVersionVal){
					dbVersionVal = +(dbVersionVal);
					fileList.sort(orderMigrations);
					toVersion = (toVersion || +(fileList[fileList.length-1].match(/\/(\d*)_.*\.json$/)[1]));
					chainSql(fileList, done, thisGrunt, function(migrationVersion, migration){
						if(migrationVersion <= toVersion){
							if(dbVersionVal < migrationVersion){
								return runQueryArray(migration.up, thisGrunt)
									.then(function(rows){
										console.log(migration.description);
										return Q.ninvoke(connection, 'query', "UPDATE database_state SET version='"+migrationVersion+"', modifiedAt=NOW()")
											.then(function(){
												console.log("...success");
											});
									}).fail(function(err){console.log(err.stack);});
							}else{
								deferred = Q.defer();
								deferred.resolve();
								console.log("moving past: "+migration.description);
								return deferred.promise
							}
						}else{
							deferred = Q.defer();
							deferred.resolve();
							console.log("complete");
							done();
							return deferred.promise
						}
					});
				});
				break;
			default:
				prompt.get({name:'description', message: 'describe the migration'}, function(err, answer){
					timestamp =	+(new Date());
					filename = timestamp+"_"+answer.description.replace(/\s/g, "_");
					content = {description: answer.description, up: [''], down: ['']};
					grunt.file.write('./etc/migrations/'+filename+'.json', JSON.stringify(content, null, "\t"))
					console.log('file created in [pinwheel]/etc/migrations/'+filename+'.json');
					done();
				});
				break;
		}

		function filePlacementFor(ray, item){
			var count = 0;
			for(count; count<ray.length; count++){
				if(ray[count].match(new RegExp("^"+item+"_"))){
					return count 
				}
			}
		}

		function runQueryArray(ray){
			query = ray.shift();
			if(query){
				return Q.ninvoke(connection, 'query', query)
					.then(function(){
						return runQueryArray(ray);
					})
			}else{
				deferred = Q.defer();
				deferred.resolve();
				return deferred.promise
			}
		}

		function chainSql(list, done, thisGrunt, func){
			file = list.shift();
			if(file){
				migrationVersion = +(file.match(/\/(\d*)_.*\.json$/)[1]);
				migration = fs.readFileSync(file);
				migration = migration.toString('utf-8')
				migration = migration.replace(/(\r\n|\n|\r|\t|\s)+/gm," ");
				migration = JSON.parse(migration);

				func(migrationVersion, migration, done)
				.then(function(){
					chainSql(list, done, thisGrunt, func);
				})
				.fail(function(err){
					console.log(err.stack);
				});
			}else{
				console.log("sql chain complete");
				done();
			}
		}

		function orderMigrations(a, b){
			var aVersion, bVersion
			aVersion = a.match(/\/(\d*)_.*\.json$/);
			aVersion = +(aVersion[1]);
			bVersion = b.match(/\/(\d*)_.*\.json$/);
			bVersion = +(bVersion[1]);
			if(aVersion == bVersion){
				return 0
			}else{
				return (aVersion>bVersion?1:-1)
			}
		}
	}
