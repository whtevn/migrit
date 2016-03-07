var MongoClient = require('mongodb').MongoClient
var fs  = require('q-io/fs')
var exec = require('child_process').exec;

function url(config, exclude_db){
  var user='';
  var db = exclude_db?'':'/'+config.database;
  if(config.user){
    user = config.user+":"+config.password+"@"
  }

  //return "mongodb://"+user+config.host+":"+config.port+db
  return user+config.host+":"+config.port
}

function mongo_connection(config){
  return new Promise(function(resolve, reject){
      var location = "mongodb://"+url(config)+"/"+config.database;
      console.log(location);
      MongoClient.connect(location, function(err, db) {
        if(err) reject(err);
        resolve(db);
      })
    });
}

var mongo_actions = {
  import: function(config, database, fixture, additive, quiet){
    var filepath  = config.__basedir+(config.fixtures)+'/'+fixture+'/'
      , msg = "beginning "+fixture+" import into "+database+" database"
      ;
    if(!quiet){
      console.log(msg.cyan);
    }

    return fs.listTree(filepath)
      .then(function(collections){
        return import_collections(url(config), filepath, collections);
      })
      .then(function(){
        if(!quiet){
          console.log("import complete".cyan);
        }
      })
      .catch(function(err){
        console.log(err);
      });
    // discover name of collection
    // discover name of database connection info
    // attach to database and import
  },
  export: function(config, database, fixtures){

    var filepath = config.__basedir+(config.fixtures||'fixtures')+'/'+fixtures+"/";
    var snapshots = []
      , msg = "beginning export of "+database+" database into the "+fixtures+" fixture set"
      , connection = config.connections[database]
      ;
    return mongo_connection(connection).then(function(db){

      console.log(msg.cyan);
      // check to see if the fixtures directory exists
      // if not, create it
      return fs.isDirectory(filepath)
        .then(function(is_directory){
          if(!is_directory){
            return fs.makeTree(filepath);
          }
        })
        .then(function(){
          return new Promise(function(resolve, reject){
            db.collections(function(err, collections){
              if(err) reject(err);
              resolve(collections);
            })
          })
        })
        .then(function(collections){
          return export_collections(url(connection, true), connection.database, filepath, collections);
        })
        .then(function(){
          console.log("export complete".cyan);
          return(db);
        });
    })
    .catch(function(err){
      console.log("error:");
      console.log(err.stack || err);
    })
  }
}

function export_collections(host, database, filepath, collections){
  return new Promise(function(resolve, reject){
    var collection = collections.shift();
    if(collections.length === 0) resolve(true);
    collection = collection.s.name;
    console.log("mongoexport --host="+host+" --collection="+collection+" --db="+database+" --out="+filepath+collection+".json");
    exec("mongoexport --host="+host+" --collection="+collection+" --db="+database+" --out="+filepath+collection+".json", function(err, stdout, stderr){
      if(err) reject(stderr)
      resolve(export_collections(host, database, filepath, collections));
    });
  })
  
}

function import_collections(host, filepath, collections){
  return new Promise(function(resolve, reject){
    var collection = collections.shift();
    if(collections.length === 0) resolve(true);
    collection = filepath[collection].match(/[\/|\\]([^\/|\\]*).json$/);
    exec("mongoimport --host "+host+" --collection "+collection+" --file"+filepath[collection], function(err, stdout, stderr){
      if(err) reject(stderr)
      resolve(import_collections(collections));
    });
  })
  
}

module.exports = mongo_actions;
