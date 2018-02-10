#!/bin/bash
help() {
    cat <<EOF
db.sh [COMMAND]

where [COMMAND] is one of

    postgres                Connect to postgres with psql
    redis                   Connect to redis with redis-cli
    migrate                 Migrate the database
    seed                    Seed the database
    up                      Migrate and seed in one step
    down                    Destroy the database
    refresh                 Recreates the database, empties redis and the file storage
    create-seed             Create a seeding CSV file.
                            Expects to be given one or more table names.
EOF
}

table_export() {
    TABLE=$1
    echo "Creating a seed file for table '$TABLE'"
    docker-compose exec postgres psql nanochan -c "COPY \"$TABLE\" TO '/data/${TABLE}.csv' WITH (FORMAT csv, DELIMITER ';', HEADER, QUOTE '\"');"
}

case "$1" in
    postgres)
        exec docker-compose exec postgres psql -U nano -a nanochan
        ;;
    redis)
        exec docker-compose exec redis redis-cli
        ;;
    migrate)
        exec docker-compose exec api yarn pg:migrate
        ;;
    seed)
        exec docker-compose exec api yarn pg:seed
        ;;
    up)
        exec docker-compose exec api yarn pg:migrateAndSeed
        ;;
    down)
        docker-compose exec postgres psql nanochan -c 'DROP SCHEMA PUBLIC cascade; CREATE SCHEMA public;' && \
        docker-compose exec redis redis-cli flushall
        ;;
    refresh)
        $0 down && \
        $0 up && \
        $0 clear-storage
        ;;
    create-seed)
        if [ "" = "$2" ]
        then
            help
        else
            # table_export $2
            while [[ ! -z "$2" ]]
            do
                table_export $2
                shift
            done
        fi
        ;;
    *)
        help
        ;;
esac
