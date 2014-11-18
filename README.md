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

  $ db migration

bring the default database up to the most recent migration

  $ db up 

bring the database up to a particular migration using a particular connection

  $ db up --migration [migration\_timestamp] --database [database\_name]

take the database all the way down

  $ db down

take the database down to a particular migration using a particular connection.
both flags optional

  $ db down --migration [migration\_timestamp] --database [database\_name]

## fixtures

  $ db export --from databaseName --to fixtureSet

  $ db import --from fixtureSet --to databaseName

