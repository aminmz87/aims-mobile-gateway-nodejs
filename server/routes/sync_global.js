import autoInject from 'async/autoInject';
import each from 'async/each';
import parallel from 'async/parallel';
import * as _ from 'underscore';


module.exports = (app, mysqlAsset, couchAsset) => {
  app.get('/sync_global', (req, res, next) => {
    console.log('[start] sync_global');

    parallel(
        [
          syncUsers,
          syncAssetLocation
          //sync_insp_task
          //sync_312_inspection

        ], (err) => {
          if(err) {
            res.json(err);

          } else {
            console.log('[sync_global] success');
            res.send('[sync_global] success');

          }

        }
    );

  });

  let syncUsers = (cb) => {
    let couchAssetUsers = couchAsset.database('asset_users');

  autoInject(
    {
      checkDb: (cb) => {
        couchAssetUsers.exists(cb);

      },
      prepDb: (checkDb, cb) => {
        if(!checkDb) {
          couchAssetUsers.create(cb);

        } else {
          cb();

        }

      },
      mysqlUsers: (cb) => {
        mysqlAsset.select('ID', 'UserID', 'Name', 'designation', 'Department', 'New_IC', 'ID_no', 'Office_phone', 'mobile').from('users').asCallback(cb);

      },
      saveToCouch: (prepDb, mysqlUsers, cb) => {
        each(
          mysqlUsers,
          (user, cb) => {
            console.log('Processing user ' + user.ID);
            couchAssetUsers.save(user.ID.toString(), user, cb);

          },
          cb
        );

      }

    }, cb
  );

  };

  let syncAssetLocation = (cb) => {
    let couchAssetLocation = couchAsset.database('asset_location');

  autoInject(
    {
      checkDb: (cb) => {
        couchAssetLocation.exists(cb);

      },
      prepDb: (checkDb, cb) => {
        if(!checkDb) {
          couchAssetLocation.create(cb);

        } else {
          cb();

        }

      },
      mysqlLocations: (cb) => {
        mysqlAsset.select('id', 'Building', 'Floor', 'Location_Name', 'Description', 'Negeri', 'Daerah').from('asset_location').asCallback(cb);

      },
      saveToCouch: (prepDb, mysqlLocations, cb) => {
        each(
          mysqlLocations,
          (location, cb) => {
            console.log('Processing location ' + location.id);

            let label = location.Daerah + '/' + (location.Building ? 'BGN/' + location.Building + '/' + location.Floor : 'KAW') + '/' + location.Location_Name;
            let code = location.Daerah + (location.Building ? 'BGN' + location.Building + location.Floor : 'KAW') + location.Location_Name;

            couchAssetLocation.save(location.id.toString(), _.extend(location, {label: label, code: code}), cb);

          },
          cb
        );

      }
    },
    cb
  );

  };

};
