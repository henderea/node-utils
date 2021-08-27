import concat from 'concat-stream';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';

export async function readAll(stream, printEncoding = false) {
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
      if(printEncoding) { process.stderr.write(`Using: ${encoding}\n`); }
      resolve(iconv.decode(buffer, encoding));
    });
    stream.on('error', reject);
    stream.pipe(concatStream);
  });
}
