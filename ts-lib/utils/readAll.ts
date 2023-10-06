import type { Stream, Writable } from 'stream';
import type { IDetectedMap } from 'jschardet';
import concat from 'concat-stream';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';

export async function readAll(stream: Stream, printEncoding: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const concatStream: Writable = concat({ encoding: 'buffer' }, (buffer) => {
      if(!buffer || buffer.length <= 0) { resolve(''); }
      let encodingResult: IDetectedMap | null = null;
      try {
        encodingResult = jschardet.detect(buffer);
      } catch {
        //ignore
      }
      const encoding: string = (encodingResult && encodingResult.encoding) ? encodingResult.encoding : 'utf8';
      if(printEncoding) { process.stderr.write(`Using: ${encoding}\n`); }
      resolve(iconv.decode(buffer, encoding));
    });
    stream.on('error', reject);
    stream.pipe(concatStream);
  });
}
