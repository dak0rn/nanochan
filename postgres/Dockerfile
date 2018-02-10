FROM alpine:3.5
LABEL maintainer "daniel.koch@valeroo.com"

# Build arguments
## The database user name
ARG DBUSER
## The user's password
ARG DBPASS
## The database name
ARG DBNAME

# Forward the args to the container
ENV DBUSER=${DBUSER}
ENV DBPASS=${DBPASS}
ENV DBNAME=${DBNAME}

ENV PGDATA "/var/lib/postgresql"

RUN apk update && \
    apk add postgresql postgresql-contrib

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER postgres

VOLUME $PGDATA
CMD ["/entrypoint.sh"]
EXPOSE 5432
