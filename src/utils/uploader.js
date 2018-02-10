const Firestore = require('@google-cloud/firestore');
const csvParser = require('./csvParser');

const firestore = new Firestore({
  projectId: 'salary-exchange',
  keyFilename: './firestore_keyfile.json',
});

function percentage(total, remainder) {
  return Math.round((((total - remainder) / total) + 0.00001) * 10000) / 100;
}

/* eslint-disable no-console */
let commited = 0;
const commitBatch = (batch, total, slice, resolve, reject) => {
  slice.forEach((data) => {
    const ref = firestore
      .collection('exchange-rates')
      .doc(data.Date);

    batch.set(ref, data);
  });

  batch.commit()
    .then((result) => {
      commited += result.length;
      console.log(`Progess...${percentage(total.length, total.length - commited)}%`);
      if (result.length === commited) {
        resolve();
      }
    })
    .catch((err) => {
      reject(err.message);
    });
};

csvParser('./data/eurofxref-hist.csv')
  .then((output) => {
    let batchOutput = output.slice(0, 500);
    let remainder = output.slice();

    console.log(`Uploading ${output.length} documents`);

    /* eslint-disable no-new */
    new Promise((resolve, reject) => {
      while (remainder.length) {
        const batch = firestore.batch();
        batchOutput = remainder.slice(0, 500);
        remainder = remainder.slice(500);

        commitBatch(batch, output, batchOutput, resolve, reject);
      }
    }).then(() => {
      console.log('Upload complete');
    }).reject(errMessage => console.log(errMessage));
  });
