var up        = require('./lib/up')
  , down      = require('./lib/down') 
  , migration = require('./lib/migration')
  , exporter  = require('./lib/export_fixtures').generate
  , importer  = require('./lib/import_fixtures').print
  , sql       = require('./lib/sql')
  , fs        = require('q-io/fs')
  , q         = require('q')
  , config    = require('confoo')
  , migrit    = {}
  ;

migrit.up        = up;
migrit.down      = down;
migrit.migration = migration;
migrit.importer  = importer;
migrit.exporter  = exporter;
migrit.sql       = sql;
migrit.config    = config.get('database-connections.json', {
    state_table: 'database_state'
  , state_field: 'timestamp'
  , migrations : 'migrations'
  , fixtures   : 'fixtures'
  }
);

module.exports = migrit;
