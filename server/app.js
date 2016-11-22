import express from 'express';
import colors from 'colors';
import mysql from 'mysql';
import knex from 'knex';
import cradle from 'cradle';
import config from '../config.json';
let app = express();

const mysqlAsset = knex(config.mysql_connection);

const couchAsset = new (cradle.Connection)('http://localhost', 5984, {
  request: {
    cache: false
    //Pass through configuration to `request` library for all requests on this connection.
  }
});

app.set('mysql', config.mysql);
app.set('domain_url', config.domain);

require('./main.js')(app, mysqlAsset, couchAsset);

app.listen(3000, () => {
  console.log('[server] this server was running successful on port ' + '3000'.red.underline);
});
