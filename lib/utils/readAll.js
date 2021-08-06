const concat = require('concat-stream');
const jschardet = require('jschardet');
const iconv = require('iconv-lite');

const readAll = async (stream) => {
  return new Promise((resolve, reject) => {
    var concatStream = concat({ encoding: 'buffer' }, (buffer) => {
      if(!buffer || buffer.length <= 0) { resolve(''); }
      let encodingResult = null;
      try {
        encodingResult = jschardet.detect(buffer);
      } catch {
        //ignore
      }
      let encoding = (encodingResult && encodingResult.encoding) ? encodingResult.encoding : 'utf8';
      process.stderr.write(`Using: ${encoding}\n`);
      resolve(iconv.decode(buffer, encoding));
    });
    stream.on('error', reject);
    stream.pipe(concatStream);
  });
};

module.exports = {
  readAll
};
