Purpose
-------
Iterative Schema Migrations - currently only works with MySQL, but future plans
include expanding to other databases

Use
---

## config file
    
migrit expects to find a `migrit.json` or `.migrit.json` file to give it
information about where and how to connect to a database, how to find the
state of the schema

it will look in all directories above your current directory, and all
directories named `etc/` inside those directories. If none is found, it will
error out

minimum migrit.json file:

    {
      "connections": {
        "local": {
          "host": "127.0.0.1"
        , "database": "migration_demo"
        , "port": "3306"
        , "user": "root"
        , "pass": ""
        }
      }
    }

optional args:

    {
      "state_table": "database_state"  // name of table migrit watches for state
    , "state_field": "timestamp"       // field with database state in state_table
    , "migrations" : "./migrations"    // path to migrations dir, relative to config
    , "fixtures"   : "./fixtures"      // path to fixtures dir, relative to config
    , "connections": {
        "local": {
          "host": "127.0.0.1"
        , "database": "migration_demo"
        , "port": "3306"
        , "user": "root"
        , "pass": ""
        }
      }
    }

connections are arbitrary. If no --database tag is specified, 'local' will be
assumed

## migrations

create a new migration

    $ migrit

bring the default database up to the most recent migration

    $ migrit up 

bring the database up to a particular migration using a particular connection

    $ migrit up --migration [migration\_timestamp] --database [database\_name]

take the database all the way down

    $ migrit down

take the database down to a particular migration using a particular connection.
both flags optional

    $ migrit down --migration [migration\_timestamp] --database [database\_name]

## fixtures

make a database into a series of JSON encoded fixtures 

    $ migrit export --from databaseName --to fixtureSet

turn a series of JSON encoded fixtures into a database

    $ migrit import --from fixtureSet --to databaseName

