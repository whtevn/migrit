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
function up(config, database, max){
  var timestamp

  migration.sql = ((sql.connection&&sql) || sql.connect(config, database));

  migration.direction = 'up';

  migration.getStateFor = function(timestamp){
    return timestamp;
  }

  migration.inRange = function(max, timestamp, state){
    var skip;
    if(timestamp <= max || !max){
      if(timestamp <= state){
        skip = 'exists'.grey
      }
    }else{
      skip = 'skipped'.grey
    }

    return skip;
  }

  // promisified mysql query, get the database state
	sql.getDBState()
    .then(function(state){
      console.log("starting migrations");
      // get the migration files
      return fs.listTree(config.__basedir+config.migrations)
        .then(function(path){
          // and execute them in order
          return migration.runSet(max, state, path)
            .then(function(){
              sql.connection.end();
            })
        });
      
    })
}



module.exports = up;
