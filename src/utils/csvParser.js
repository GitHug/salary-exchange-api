const { createReadStream } = require('fs');
const parse = require('csv-parse');

const options = {
  ltrim: true,
  rtrim: true,
  columns: true,
  skip_empty_lines: true,
  skip_lines_with_empty_value: true,
  delimiter: ',',
};

const removeEmptyLines = record => Object.keys(record)
  .filter(key => !!key)
  .reduce(
    (newRecord, key) =>
      Object.assign(newRecord, { [key]: record[key] }), // Copy value.
    {},
  );

const csvParser = filePath => new Promise((resolve, reject) => {
  const data = [];

  const input = createReadStream(filePath);

  const parser = parse(options);
  parser.on('finish', () => {
    input.close();
    parser.end();
    resolve(data);
  });
  parser.on('readable', () => {
    let record = parser.read();
    while (record) {
      // Removes empty lines
      const modifiedRecord = removeEmptyLines(record);

      data.push(modifiedRecord);

      record = parser.read();
    }
  });
  parser.on('error', err => reject(err.message));

  input.pipe(parser);
});

module.exports = csvParser;
