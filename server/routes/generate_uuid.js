import autoInject from 'async/autoInject';
import QRCode from 'qrcode';
import uuid from 'uuid';

module.exports = (app, mysqlAsset, couchAsset) => {
  app.get('/gen_uuid', (req, res) => {
    const userId = req.query.user_id;
    const _uuid = uuid.v4();
    const mobileUrl = app.settings.domain_url + '/mobile_db';
    const qrtext = mobileUrl + ';' + _uuid;

    userMapping (_uuid, userId, (err) => {
        if(!err) {
          QRCode.drawSvg(qrtext, (err, url) => {
            if (err) {
              res.json(err);
            } else {
              res.send(url);
            }
          });

        } else {
          console.log('error: ', err);

        }

      });

  });

  let userMapping = (uuid, userId, cb) => {
    const couchMapUser = couchAsset.database('uuid_sync_map_user');

    autoInject({

      checkDb: (cb) => {
        couchMapUser.exists(cb);

      },
      prepDb: (checkDb, cb) => {
        if(!checkDb) {
          couchMapUser.create(cb);

        } else {
          cb();

        }

      },

      saveUser: (checkDb, prepDb, cb) => {
        couchMapUser.save(uuid, {user_id: userId}, cb);

      }

    }, cb);

};

};
