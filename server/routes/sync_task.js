import autoInject from 'async/autoInject';
import each from 'async/each';


module.exports = (app, mysqlAsset, couchAsset) => {
  app.get('/get_refno', (req, res, next) => {
    const couchMapUser = couchAsset.database('uuid_sync_map_user');
    const couchInspTask = couchAsset.database('asset_insp_task');
    const couchInspTaskItem = couchAsset.database('asset_insp_task_item');
    const uuid = req.query.uuid;

    autoInject({
      checkDbInspTask: (cb) => {
        couchInspTask.exists(cb);
      },

      prepDbInspTask: (checkDbInspTask, cb) => {
        if (!checkDbInspTask) {
          couchInspTask.create(cb);
        } else {
          cb();
        }
      },

      checkDbInspTaskItem: (cb) => {
        couchInspTaskItem.exists(cb);
      },

      prepDbInspTaskItem: (checkDbInspTaskItem, cb) => {
        if (!checkDbInspTaskItem) {
          couchInspTaskItem.create(cb);
        } else {
          cb();
        }
      },

      prepDbInspTaskItemFilter: (checkDbInspTaskItem, prepDbInspTaskItem, cb) => {
        if (!checkDbInspTaskItem) {
          console.log('create filter');
          couchInspTaskItem.save('_design/asset_insp_task_item', {
            views: {
              all: {
                map: 'function (doc) { emit([doc.Ref_No], doc) }'
              }
            }
          }, cb);

        } else {
          cb();

        }

      },

      createDbInspTaskItemFilter: (prepDbInspTaskItem, cb) => {
        //todo filter was not supported in cradle.

      },

      getUserId: (cb) => {
        couchMapUser.get(uuid, (err, docs) => {
          if(err) {
            cb(err);
          } else {
            cb(null, docs);
          }
        });
      },

      retrieveLegacyInspTask: (getUserId, cb) => {
        mysqlAsset.raw('SELECT i.ID, i.Title, i.Ref_no, i.Creation_date, c.Description FROM insp_task i INNER JOIN code_001_cawangan c ON (Left(i.daerah_pemeriksaan,6) = CONCAT(c.Code_Negeri, c.Code_Daerah, c.Code)) WHERE i.Status = "A" AND userid = ' + getUserId.user_id + ' OR Officer2_uid=' + getUserId.user_id).asCallback(cb);
      },

      saveInspTask: (prepDbInspTask, retrieveLegacyInspTask, cb) => {
        let refnos = [];

        each(retrieveLegacyInspTask[0], (task, cb) => {
          refnos.push(task.Ref_no);
          couchInspTask.save(task.Ref_no.toString(), task, cb);

        }, (err) => {
            cb(err, refnos);
        });
      },

      retrieveLegacyInspTaskItem: (prepDbInspTaskItem, getUserId, saveInspTask, cb) => {
        const refnos = saveInspTask;
        let stringRefnos = refnos.length === 0 ? '' : '"' + refnos.join('","') + '"';

        mysqlAsset.raw('SELECT ID, Ref_No, Asset_DB_ID, Code, kategori, aset, aset_daerah, Curr_Location, Curr_LocCode, Curr_Location_Description, prev_state, Creation_Date, Prev_Officer_DB_ID, Prev_Officer_ID, Prev_Officer, Prev_Officer_Designation, Prev_Officer_Daerah, Curr_Officer, Curr_Officer_DB_ID, Curr_Officer_ID, Curr_Officer_Designation, Curr_Officer_Daerah, rec_date, brand, JenisHarta, label, cost, chasis, reg_serial, Exact_Location, Exact_LocCode, Exact_Location_Description, Verify_Move, State, catatan, PA2_Lengkap, PA2_Kemaskini FROM 312_inspection WHERE Ref_No IN (' + stringRefnos + ')').asCallback((err, items) => {
          if(err) {
            cb(err);
          }

          each(items[0], (item, cb) => {
            couchInspTaskItem.save(item, cb);

          }, (err) => {
            if(err) {
              cb(err);

            } else {
              res.end(refnos.toString());

            }

          });

        });

      }

    }, (err) => {
      if(err) {
        console.log('err', err);
        res.end('false');

      } else {
        res.end('success');
      }

    });


  });

};
