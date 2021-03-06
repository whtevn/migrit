#!/usr/bin/env node
var fs  = require('q-io/fs')
  , sql = require('./sql')
  , q   = require('q')
  , _   = require('underscore')
  , uuid= require('node-uuid')
  , Exporter
  ;

function fixData(fixture_data, field_data){
  field_data = _.omit(field_data, function(field){
    return !field.Type.match('date') && !field.Type.match('timestamp')
  })
  field_data = _.values(field_data).map(function(field){
    return field.Field
  });

  fixture_data.forEach(function(fixture){
    field_data.forEach(function(field){
      var date   = new Date(fixture[field])
        , result = fixture[field];

      if(fixture[field] && fixture[field] != "0000-00-00 00:00:00"){
        result = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" ";
        result = result+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
      }

      fixture[field] = result;
    })
  });

  return fixture_data;
}

function fieldType(name, field_data){
}

Exporter = {
  generate: function (config, database, fixtures){
    Exporter.config = config;
    Exporter.database = database;
    Exporter.fixtures = fixtures;
    Exporter.filepath = config.__basedir+(config.fixtures||'fixtures')+'/'+fixtures+"/";
    var snapshots = []
      , msg = "beginning export of "+database+" database into the "+fixtures+" fixture set"
      ;
    console.log(msg.cyan);
    sql.connect(config, database);
    // check to see if the fixtures directory exists
    // if not, create it
    fs.isDirectory(Exporter.filepath)
      .then(function(is_directory){
        if(!is_directory){
          return fs.makeTree(Exporter.filepath);
        }
      })
      .then(function(){
        return sql.query("SHOW TABLES")
      })
      .then(function(tables){
        tables = tables.map(function(table){
          return table['Tables_in_'+config.connections[database].database]
        });
        return Exporter.snapshot(tables);
      })
      .then(function(){
        console.log("export complete".cyan);
        sql.connection.end();
      });
  }

, snapshot: function(tables){
    if(!tables || tables.length == 0){
      return true;
    }
    var table = tables.shift();
    return q.all([
      sql.query(
        "SHOW INDEX FROM "+table
      )
    , sql.query(
        "SHOW FIELDS FROM "+table
      )
    , sql.query(
        "SELECT * FROM "+table
      )
    ]).then(function(rows){
      var db_info = rows[0]
        , field_data = rows[1]
        , fixture_data = rows[2]
        , key_field
        , msg = "exporting "+fixture_data.length+" entries from "+table+" table"
        ;
      if(db_info.length > 0){
        db_info.forEach(function(info){
          if(info.Key_name == 'PRIMARY'){
            key_field = info.Column_name;
          }
        })
      }
      console.log(msg.yellow);
      fixture_data = fixData(fixture_data, field_data);
      return Exporter.write(table, key_field, fixture_data);
    })
    .then(function(){
      console.log("\t...done".green);
      return Exporter.snapshot(tables)
    })
    .catch(function(err){
      console.log(err);
    })
  }
, write: function(table, key_field, data){
    var filename = Exporter.filepath+table+".json" 
      , fixture_set = {}
      ;

    data.forEach(function(item){
      if(key_field){
        id = item[key_field];
      }else{
        id = uuid.v4();
      }
      fixture_set[id] = item
    });
    
    fixture_set = JSON.stringify(fixture_set, null, "\t");
    return fs.write(filename, fixture_set)
        
  }
}

module.exports = Exporter;
