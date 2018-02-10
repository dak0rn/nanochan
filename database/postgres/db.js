require('../../evilGlobalVariables');
const pg = require('pg-promise')();
const config = require('../../src/services/config');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const migrate = async function(trx, views = true) {
    console.log('Starting migration');

    let con;

    // Don't initialize if we're handed a transaction, we don't need two connections
    if (!trx) con = pg(config.postgres);

    const migrationPaths = glob
        .sync(path.resolve(__dirname, 'migrations', '*.sql'))
        .filter(file => !!path.basename(file).match(/^\d{3}_.*\.sql$/))
        .sort();

    const migrationFiles = migrationPaths.map(p => fs.readFileSync(p, { encoding: 'utf-8' }));

    const exec = trans => {
        return migrationFiles
            .reduce((prev, curr, idx) => {
                return prev.then(() => {
                    console.log(`Executing migration ${path.basename(migrationPaths[idx]).replace(/\.sql/, '')}`);

                    return trans.none(curr);
                });
            }, Promise.resolve())
            .then(() => {
                if (!views) return;

                const viewPaths = glob
                    .sync(path.resolve(__dirname, 'views', '*.sql'))
                    .filter(file => !!path.basename(file).match(/^\d{3}_.*\.sql$/))
                    .sort();

                const viewFiles = viewPaths.map(p => fs.readFileSync(p, { encoding: 'utf-8' }));

                return viewFiles.reduce((prev, curr, idx) => {
                    return prev.then(() => {
                        console.log(`Executing view ${path.basename(viewPaths[idx]).replace(/\.sql/, '')}`);

                        return trans.none(curr);
                    });
                }, Promise.resolve());
            });
    };

    try {
        if (!trx)
            await con.tx(t => {
                return exec(t);
            });
        else {
            await exec(trx);
        }
    } catch (e) {
        console.log('An error occured while migrating: ', e);
        pg.end();
        return;
    }

    pg.end();
    console.log('Finished migration successfully');
};

const seed = async function(trx) {
    console.log('Starting seeding');

    let con;

    // Don't initialize a connection if we receive a transaction
    if (!trx) con = pg(config.postgres);

    // Ensure we have all migrations in the right order
    const migrationPaths = glob
        .sync(path.resolve(__dirname, 'migrations', '*.sql'))
        .filter(file => !!path.basename(file).match(/^\d{3}_.*\.sql$/))
        .sort()
        .map(file => path.basename(file).replace(/^\d{3}_(.*)\.sql$/, '$1'));

    // Get seeding files that we have migrations for
    const seedingFiles = glob
        .sync(path.resolve(__dirname, 'data', '*.csv'))
        .map(p => path.basename(p).replace('.csv', ''));

    // Get files to seed from the point of migrations, as they're sorted
    // This will also ensure that we don't try to seed any table that does not exist
    const filesToSeed = migrationPaths.filter(f => seedingFiles.indexOf(f) >= 0);

    const exec = trans => {
        let d = Date.now();
        return filesToSeed.reduce((prev, curr) => {
            return prev.then(() => {
                const qry = `COPY "${curr}" FROM '${path.resolve(
                    config.csvPath,
                    curr + '.csv'
                )}' WITH (FORMAT csv, DELIMITER ";", HEADER, QUOTE '"')`;
                console.log('Seeding table ' + curr);
                return trans.none(qry).then(() => {
                    console.log(`          took ${Date.now() - d} ms`);
                    d = Date.now();
                });
            });
        }, Promise.resolve());
    };

    try {
        if (!trx)
            await con.tx(t => {
                return exec(t);
            });
        else await exec(trx);
    } catch (e) {
        console.log('An error occured while seeding: ', e);
        pg.end();
        return;
    }

    pg.end();
    console.log('Finished seeding successfully');
};

const full = async function() {
    const con = pg(config.postgres);

    try {
        await con.tx(trx => {
            return migrate(trx, true).then(() => seed(trx));
        });
    } catch (e) {
        console.log('An error occured during migration + seeding: ', e);
        pg.end();
        return;
    }
};

const help = function() {
    console.log(`
The only valid parameters for this script are:
migrate - calls all migration files
seed - seeds all tables that have migration files with the same number
full - migrates and seeds afterwards, within the same transaction
`);
};

const mapping = {
    migrate,
    seed,
    full
};

const param = process.argv[2];

if (!param || !mapping[param]) {
    help();
    process.exit(0);
}

mapping[param]();
