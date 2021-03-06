#!/usr/bin/env node
  var Importer = {}
    , fs = require('q-io/fs')
    , sql = require('./sql')
    , _  = require('underscore')
    , q  = require('q')
    , color = require('color');
    ;

Importer.print = function(config, database, name, additive, quiet){
  Importer._quiet = quiet;
  var filepath  = config.__basedir+(config.fixtures)+'/'+name+'/'
    , msg = "beginning "+name+" import into "+database+" database"
    ;
  if(!quiet){
    console.log(msg.cyan||msg);
  }
  Importer.config = config;
  sql.connect(config, database);
  return fs.listTree(filepath)
    .then(function(path){
      return Importer.execute(path, additive);
    })
    .then(function(){
      if(!quiet){
        console.log("import complete".cyan||"import complete");
      }
      return(sql.connection);
    })
    .catch(function(err){
      console.log(err);
      throw err
    });
}

Importer.reset = function(config, basedir, database, fixtures, additive, quiet){
  database = database||'local';
  fixtures = fixtures||'default';
  additive = additive||false;
  if(quiet===undefined){
    quiet=true;
  }
  var defaults = {
    state_table: 'database_state'
  , state_field: 'timestamp'
  , migrations : 'migrations'
  , fixtures   : 'fixtures'
  , __basedir  : basedir
  }
  Importer.config = Object.assign({}, defaults, config);
  sql.connect(Importer.config, database, true)
  
  return Importer.print(Importer.config, database, fixtures, additive, quiet);
}


Importer.execute = function(tables, additive){
  if(!tables || tables.length == 0){ return true; }

  var table = tables.shift();
  return fs.isFile(table)
    .then(function(is_file){
      if(is_file && !table.match(/\/\.[^\/]*$/)){
        return fs.read(table)
            .then(function(contents){
              var tablename = table.match(/[\/|\\]([^\/|\\]*).json$/);
              if(tablename){
                table = tablename[1];
              }else{
                console.log(table);
              }
              return contents;
            })
            .then(function(contents){
              var msg;
              contents = _.values(JSON.parse(contents));

              if(table != Importer.config.state_table){
                return Importer.delete(table, additive)
                               .then(function(){
                                  msg = "writing "+contents.length+" entries to "+table;
                                  !Importer._quiet && (console.log(msg.yellow || msg));
                                  return Importer.write2Table(table, contents)
                                })
              }
            })
            .catch(function(err){
              console.log(err.stack);
              throw err
            });
      }
    })
    .then(function(){
      return Importer.execute(tables, additive);
    })
    .catch(function(err){
      console.log(err.stack);
      throw err
    });
}

Importer.delete = function(table, additive){
  var deferred = q.defer();
  if(!additive){
    msg = "removing current contents from "+table;
    !Importer._quiet && console.log(msg.red||msg);
    return sql.query('DELETE FROM '+table)
              .then(function(){
                deferred.resolve();
              });
  }else{
    deferred.resolve();
  }
  return deferred.promise;
}

Importer.write2Table = function(table, contents){
    if(!contents || contents.length == 0){
      !Importer._quiet && console.log("\t...done".green||"\t...done");
      return true; 
    }
    var row = _.omit(contents.shift(), function(value, key, obj){
          return (!value && !(value == 0 || value == ''));
        })
      , fields = _.keys(row).join(", ")
      , values = _.values(row)
      , query 
      ;

      values = values.filter(function(field){
          return (field || field == 0 || field == '')
        })
        .map(function(field){
          return sql.connection.escape(field)
        }).join(", ");

      if(table == Importer.config.state_table){
        return true
      }else{
        query = "INSERT INTO "+table+"("+fields+")VALUES("+values+")"
        return sql.query(query)
           .then(function(){;
              return Importer.write2Table(table, contents);
            });
      }
}

module.exports = Importer;
