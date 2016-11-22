module.exports = (app, mysqlAsset, couchAsset) => {
  require ('./routes/generate_uuid.js')(app, mysqlAsset, couchAsset);
  require ('./routes/gen_qr.js')(app, mysqlAsset, couchAsset);
  require ('./routes/sync_global.js')(app, mysqlAsset, couchAsset);
  require ('./routes/sync_task.js')(app, mysqlAsset, couchAsset);

};
