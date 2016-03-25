#!/usr/bin/env node
var fs  = require('q-io/fs')
  , sql = require('./sql')
  , migration = require('./migration')
  ;

// read and run migrations files in order 
// to bring a database at a particular connection up
// to whatever chosen maximum. 

// config - an object literal with database connection information 
//          and other connection information
function up(config, database, min){
  var timestamp

  migration.sql = sql.connect(config, database);

  migration.direction = 'down';

  migration.getStateFor = function(timestamp, migrations){
    migrations = migrations.map(function(mig){
      return migration.getTimestampFromFilename(mig);
    }).filter(function(mig) {
      return mig
    });
    return migrations[migrations.length-1]||0;
  }

  migration.inRange = function(min, timestamp, state){
    var skip;
    if(timestamp > min || !min){
      if(timestamp > state){
        skip = 'exists'.grey
      }
    }else{
      skip = 'skipped'.grey
    }

    return skip;
  }

  // promisified mysql query, get the database state
	return sql.getDBState()
    .then(function(state){
      console.log("starting migrations");
      // get the migration files
      return fs.listTree(config.__basedir+(config.migrations||'migrations'))
        .then(function(path){
          // and execute them in order
          return migration.runSet(min, state, path.reverse())
            .then(function(){
              sql.connection.end();
            });
        });
      
    })
}



module.exports = up;
