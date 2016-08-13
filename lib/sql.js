#!/usr/bin/env node

var mysql = require('mysql')
  , q     = require('q')
  , sql
  ;

sql = {
  connect: function(config, db, force){

    sql.config = config;

    if(typeof sql.config.connections[db].port == "object"){
       sql.config.connections[db].port =  sql.config.connections[db].port.oustide
    }
    if(force){
      try {
      if(sql.connection) sql.connection.end()
      }catch(e){}
      sql.connection = mysql.createConnection(sql.config.connections[db]);
    }else{
      sql.connection = (sql.connection || mysql.createConnection(sql.config.connections[db]));
    }
    return sql;
  }

, query: function(query){
    return q.ninvoke(sql.connection, 'query', query)
      .then(function(rows){
        return rows[0];
      });
  }

, kill: function(query){
    sql.connection.end();
    delete sql.connection
  }

, getDBState: function(){
    return sql.query("SELECT "+sql.config.state_field+" FROM "+sql.config.state_table)
      .then(function(rows){
        return ((rows[0]&&+(rows[0][sql.config.state_field])) || 0);
      })
      .catch(function(err){        
        if(err.code == 'ER_NO_SUCH_TABLE'){
          return sql.initializeStateTable()
             .then(function(){
                return sql.getDBState();
             });
        }else{
          // error out if there was some other reason for the state retrieval error
          console.log('lib/sql'.red, 'line 33:'.red, err.message);
          process.exit(1);
        }
      });
}

, batch: function(state, statements, skip){
    if((!statements || statements.length == 0) || skip){
      return true;
    }

    var statement = statements.shift()
      , table_name = sql.config.state_table
      , field_name = sql.config.state_field
      ;
    console.log("\t"+statement.yellow);
    return sql.query(statement)
      .then(function(){
        return sql.query("UPDATE "+table_name+" SET "+field_name+"= '"+state+"'");
      })
      .then(function(){
        return sql.batch(state, statements);
      })
      .catch(function(err){
        console.log("\t\tlib/sql".red, "line 58:".red, err.message);
        console.log(err);
        process.exit(1);
      })
  }

, initializeStateTable: function(){
    var table_name = sql.config.state_table
      , field_name = sql.config.state_field
      ;
    console.log("creating "+table_name+" table with an integer field named '"+field_name+"'");

    // if no state table is found, attempt to create it
    return sql.query(
      "CREATE TABLE "+table_name+"("+field_name+" VARCHAR(255), updated_at DATETIME)"
    )
    .then(function(){
      console.log("inserting initial values into "+table_name);

      // and then populate it with an appropriate first row
      return sql.query("INSERT INTO "+table_name+"("+field_name+", updated_at) VALUES(0, NOW())");
    })
    .catch(function(err){
      // error out if no state table was found and it was unable to be corrected
      console.log("lib/sql".red, "line 52:".red, err.message);
      process.exit(1);
    });
  }
};

module.exports = sql;
