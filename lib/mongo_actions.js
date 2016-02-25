var MongoClient = require('mongodb').MongoClient
var fs  = require('q-io/fs')
var exec = require('child_process').exec;

function url(config){
  var user='';
  if(config.user){
    user = config.user+":"+config.password+"@"
  }
  return "mongodb://"+user+config.host+":"+config.port+"/"+config.database
}

function mongo_connection(config){
  return new Promise(function(resolve, reject){
      MongoClient.connect(url(config), function(err, db) {
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
        return import_collections(filepath, collections);
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
      ;
    return mongo_connection(config.connections[database]).then(function(db){

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
          return export_collections(collections);
        })
        .then(function(){
          console.log("export complete".cyan);
          return(db);
        });
    })
    .catch(function(err){
      console.log(err);
    })
  }
}

function export_collections(collections){
  return new Promise(function(resolve, reject){
    var collection = collections.shift();
    if(collections.length === 0) resolve(true);
    exec("mongoexport --collection "+collection+" --out "+filepath+collection+"+.json", function(err, stdout, stderr){
      if(err) reject(stderr)
      resolve(export_collections(collections));
    });
  })
  
}

function import_collections(filepath, collections){
  return new Promise(function(resolve, reject){
    var collection = collections.shift();
    if(collections.length === 0) resolve(true);
    collection = filepath[collection].match(/[\/|\\]([^\/|\\]*).json$/);
    exec("mongoimport --collection "+collection+" --file"+filepath[collection], function(err, stdout, stderr){
      if(err) reject(stderr)
      resolve(import_collections(collections));
    });
  })
  
}

module.exports = mongo_actions;
