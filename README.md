Purpose
-------
Manage database migrations and fixtures

Use
---

db expects a `migrations/` and `fixtures/` directory in the current working
directory. If these do not exist, will traverse up directories until it finds
a `.db_config` file.

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

