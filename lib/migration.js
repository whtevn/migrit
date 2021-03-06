#!/usr/bin/env node

var fs = require('q-io/fs')
  , Migration = {}
  ;

Migration.getTimestampFromFilename = function(file){
  var match = file.match(/\/(\d*)_.*$/); 
  if(match){
    match = +(match[1]);
  }
  return match;
}

Migration.create = function(title, config){
  var timestamp = +(new Date)
    , filename  = timestamp+"_"+title.replace(/\s/g, "_")+".json"
    , filepath  = config.__basedir+(config.migrations)+'/'
    , migration = {
        author:      ""
      , description: title
      , created_at:  timestamp
      , up:   ['']
      , down: ['']
      }
    ;

    migration = JSON.stringify(migration, null, "\t");

    fs.isDirectory(filepath)
      .then(function(is_directory){
        if(!is_directory){
          return fs.makeDirectory(filepath);
        }
      })
      .then(function(){
        fs.write(filepath+filename, migration)
        .then(function(res){
          console.log(filepath+filename+" has been written");
        });
    });
}



Migration.runSet = function (max, state, migrations){
  if(migrations && migrations.length==0){
    // end execution if there are no more migrations to run
    console.log('finished');
    return true
  }

  // look at each migration file under the given path
  return fs.isFile(migrations[0])
    .then(function(is_file){
      // get the current database state
      var display = Migration.getTimestampFromFilename(migrations[0])
        , skip      = Migration.inRange(max, display, state)
        , file      = migrations.shift()
        ;
      if(is_file && !file.match(/\/\.[^\/]*$/)){
        // if the path being examined is a file, and the timestamp
        // is under the given maximum, or there is no given maximum
        timestamp = Migration.getStateFor(display, migrations);

        return Migration.run(file, timestamp, skip, display);
      }
    })
    .then(function(){
      return Migration.runSet(max, state, migrations);
    });
}

Migration.getSet = function(config){
  return fs.listTree(config.__basedir+(config.migrations))
    .then(function(files){
      return files.map(Migration.getTimestampFromFilename)
                  .filter(function(file){
                    return file
                  });
    })
}


Migration.run = function(file, timestamp, skip, display){
  return fs.read(file)
    .then(function(migration){
      migration = migration.replace(/(\r\n|\n|\r|\t)/gm," ");
      migration = JSON.parse(migration);
      console.log((skip||'running'.magenta), (display&&display.toString().grey), migration.description.green);

      return Migration.sql.batch(timestamp, migration[Migration.direction], skip)
    });
}
module.exports = Migration; 
