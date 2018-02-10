#!/bin/sh

# Entrypoint for the containerized database
# Ensures the required setup is performed on the share before
# starting the database

if [ "$PGDATA" = "" ]
then
    echo "Environment variable PGDATA is not set"
    exit 1
fi

if [ ! -d "$PGDATA" ]
then
    echo "Directory $PGDATA does not exist - no volume mounted?"
    exit 2
fi

# Postgres will refuse to work on a non-empty folder when initializing and the
# mount point might have a dotfile
PGDATA="$PGDATA/9.6"

if [ ! -d "$PGDATA" ]
then
    echo "Database seems to be uninitialized - doing so"
    mkdir $PGDATA
    initdb --pgdata=$PGDATA && \
        pg_ctl start && \
        sleep 4 && \
        createuser -d -l -s $DBUSER && \
        createdb -O $DBUSER $DBNAME && \
        psql -c "ALTER ROLE $DBUSER WITH PASSWORD '$DBPASS'" && \
        psql -a $DBNAME -c 'CREATE EXTENSION "uuid-ossp" WITH SCHEMA pg_catalog' && \
        echo "host all all all md5" >> $PGDATA/pg_hba.conf && \
        echo "listen_addresses = '0.0.0.0'" >> $PGDATA/postgresql.conf && \
        pg_ctl stop

fi

exec /usr/bin/postgres
