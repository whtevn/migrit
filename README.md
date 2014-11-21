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
      , "staging": {
          "host": "my.fancy.sqlserver.com"
        , "database": "migration_staging"
        , "port": "6606"
        , "user": "mySqlAdmin"
        , "pass": "super5ecret"
        }
      , "etc": {
          "host": "my.fancy.sqlserver.com"
        , "database": "migration_etc"
        , "port": "6606"
        , "user": "mySqlAdmin"
        , "pass": "super5ecret"
        }
      }
    }

connections are arbitrary. If no --database tag is specified, 'local' will be
assumed

## create migrations

create a new migration

    $ migrit

which will prompt you for your migration's puprose

    $ migrit -t 'set up users table'

this will create a new migration file named something like
`1416595944375_set_up_users_table`, and inside that file will be some json
within which you will add your sql to define the migration

for example:

    {
      "author": "Evan Short",
      "description": "set up users table",
      "created_at": 1416595944375,
      "up": [
        "CREATE TABLE users(user_id VARCHAR(255), created_at DATETIME)"
      ],
      "down": [
        "DROP TABLE users"
      ]
    }

or, because the sql blocks are defined in arrays, you may issue multiple sql
commands

    {
      "author": "Evan Short",
      "description": "set up users table",
      "created_at": 1416595944375,
      "up": [
        "CREATE TABLE users(user_id VARCHAR(255), created_at DATETIME)"
      , "alter table users add name varchar(255)"
      ],
      "down": [
        "alter table users drop column name"
      , "DROP TABLE users"
      ]
    }

## bring up the database

once you have created a migration, you will want to apply it to your database

    $ migrit up 

bring the database up to a particular migration using a particular connection

    $ migrit up --max [migration_timestamp] --database [database_name]

without the `--database` option, migrit assumes you mean `local`

## bring down the database

take the database all the way down

    $ migrit down

take the database down to a particular migration using a particular connection.
both flags optional

    $ migrit down --min [migration_timestamp] --database [database_name]

without the `--database` option, migrit assumes you mean `local`

## fixtures

make a database into a series of JSON encoded fixtures 

    $ migrit export --from databaseName --to fixtureSet

turn a series of JSON encoded fixtures into a database

    $ migrit import --from fixtureSet --to databaseName

