import QRCode from 'qrcode';
import uuid from 'uuid';

module.exports = (app, mysqlAsset, couchAsset) => {
  app.get('/gen_qrcode', (req, res) => {
    const _uuid = uuid.v4();
    const mobileUrl = 'https://umk.asset.my/mobile_db';
    const qrtext = mobileUrl + ';' + _uuid;

    QRCode.drawSvg(qrtext, (err, url) => {
      if (err) {
        res.json(err);
      } else {
        res.send(url);
      }
    });
  });
};
