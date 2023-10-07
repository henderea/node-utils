import path from 'path';
import fs from 'fs';

import _ from 'lodash';


function basicStyle(o: string | number, c: string | number): (text: string) => string {
  return (text: string) => `\u001B[${o}m${text}\u001B[${c}m`;
}

const bold = basicStyle(1, 22);
const red = basicStyle(31, 39);
const boldGreen = basicStyle('1;32', '22;39');

const mappedChars: Dictionary<string> = {};
const warnings: string[] = [];
function quote(str: string): string {
  const sq: boolean = /'/.test(str);
  const dq: boolean = /"/.test(str);
  if(sq && dq) { return `\`${str}\``; }
  if(sq) { return `"${str}"`; }
  return `'${str}'`;
}

function addWarning(replacement: string, char: string, message: string): void {
  warnings.push(`${quote(replacement).padEnd(8)} => ${quote(char)} -> ${message}`);
}

const rawMappings: Dictionary<SortablePattern[]> = {};
const rawKeys: string[] = [];
const charPattern: RegExp = /^([0-9A-F]{4})(?:-([0-9A-F]{4})(?:[/]([1-9]\d*))?)?$/;

type HexChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

type CharCode = `${HexChar}${HexChar}${HexChar}${HexChar}`;

type Char = string | `${string}-${string}` | `${string}-${string}/${number}`;

interface SortablePattern {
  pattern: string;
  index: number;
}

interface CharParseResult {
  chars: string[];
  patterns: SortablePattern[];
}
function processChar(rawStart: string, rawEnd: string | null, rawSpacing: string | null): CharParseResult {
  const start: number = parseInt(rawStart, 16);
  if(!rawEnd) {
    return { chars: [rawStart], patterns: [{ pattern: `\\u${rawStart}`, index: start }] };
  }
  const chars: string[] = [];
  const patterns: SortablePattern[] = [];
  const end: number = parseInt(rawEnd, 16);
  const spacing: number = (rawSpacing ? parseInt(rawSpacing) : 1);
  if(spacing == 1) {
    patterns.push({ pattern: `\\u${rawStart}-\\u${rawEnd}`, index: start });
  }
  for(let i = start; i <= end; i += spacing) {
    const char: string = i.toString(16).padStart(4, '0').toUpperCase();
    chars.push(char);
    if(spacing > 1) {
      patterns.push({ pattern: `\\u${char}`, index: i });
    }
  }
  return { chars, patterns };
}
function map(replacement: string, ...characters: Char[]): void {
  const list: SortablePattern[] = rawMappings[replacement] || [];
  for(const baseChar of characters) {
    const result: RegExpExecArray | null = charPattern.exec(baseChar);
    if(result) {
      const { chars, patterns } = processChar(result[1], result[2], result[3]);
      const conflictingChars: string[] = chars.filter((char: string) => char in mappedChars);
      if(conflictingChars.length > 0) {
        for(const char in conflictingChars) {
          addWarning(replacement, char, `already mapped to ${mappedChars[char]}`);
        }
      } else {
        list.push(...patterns);
        for(const char in chars) {
          mappedChars[char] = replacement;
        }
      }
    } else {
      addWarning(replacement, baseChar, 'invalid format');
    }
  }
  if(list.length > 0) {
    if(!(replacement in rawMappings)) {
      rawKeys.push(replacement);
    }
    rawMappings[replacement] = list;
  }
}

interface Mapping {
  replacement: string;
  pattern: string;
}

const mappings: Mapping[] = [];

type RawChar = CharCode | `${CharCode}?`;

function mapRaw(replacement: string, ...rawChars: RawChar[]) {
  const pieces: string[] = [];
  const chars: string[] = [];
  for(const rawChar of rawChars) {
    pieces.push(`\\u${rawChar}`);
    chars.push(rawChar.slice(0, 4));
  }
  const pattern: string = pieces.join('');
  mappings.push({ replacement, pattern });
  for(const char in chars) {
    mappedChars[char] = `${replacement} (raw)`;
  }
}

function validate(): boolean {
  if(warnings.length > 0) {
    const title: string = 'Found Warnings';
    const header: string = bold(`${'!'.repeat(title.length + 6)}\n!! ${red(title)} !!\n${'!'.repeat(title.length + 6)}`);
    process.stderr.write(`
${header}

${warnings.map((w) => `!! ${w}`).join('\n')}
`);
    return false;
  }
  return true;
}

mapRaw('...', '00E2', '0080', '00A6?');
mapRaw('«', '00C2?', '00AB');
mapRaw('»', '00C2?', '00BB');
mapRaw('', '00C2', '00A0');

map('A', '00C0-00C5', '0100-0104/2', '01CD', '01DE', '01E0', '01FA', '0200', '0202', '0226', '023A', '0410', '04D0', '04D2', '1D00', '1D2C', '1E00', '1EA0-1EB6/2', '1F08-1F0F', '1F88-1F8F', '1FB8-1FBC', '212B', '2C6D', '2C6F', '2C70');
map('a', '00E0-00E5', '0101-0105/2', '01CE', '01DF', '01E1', '01FB', '0201', '0203', '0227', '0250', '0251', '0252', '0430', '04D1', '04D3', '1D43-1D45', '1D8F', '1D90', '1D9B', '1E01', '1E9A', '1EA1-1EB7/2', '1F00-1F07', '1F70', '1F71', '1F80-1F87', '1FB0-1FB7', '2090', '2C65');
map('AE', '00C6', '01E2', '01FC', '04D4', '0D01', '1D2D');
map('ae', '00E6', '01E3', '01FD', '04D5', '1D02', '1D46');
map('B', '00DF', '0181', '0182', '0184', '0243', '0299', '0411', '0412', '0432', '1D03', '1D2E', '1D2F', '1D5D', '1D66', '1E02-1E06/2', '1E9E', '212C', '2C82');
map('b', '0180', '0183', '0185', '0253', '042A', '042C', '044A', '044C', '0462', '0463', '048C', '048D', '1D47', '1D6C', '1D80', '1E03-1E07/2', '2C83');
map('bl', '042B', '044B', '04F8', '04F9');
map('C', '00C7', '0106-010C/2', '0186', '0187', '023B', '0297', '0421', '04AA', '1D04', '1E08', '2102', '212D', '2CA4');
map('c', '00E7', '0107-010D/2', '0188', '023C', '0254', '0255', '0441', '04AB', '1D9C', '1D9D', '1E09', '2CA5');
map('D', '00D0', '010E', '0110', '0189', '018A', '018B', '1D05', '1D06', '1D30', '1E0A-1E12/2', '2145');
map('d', '010F', '0111', '018C', '0221', '0256', '0257', '0500-0503', '056A', '1D48', '1D6D', '1D81', '1D91', '1E0B-1E13/2', '2146');
map('db', '0238');
map('DZ', '01C4', '01F1');
map('Dz', '01C5', '01F2');
map('dz', '01C6', '01F3', '02A3-02A5');
map('E', '00C8-00CB', '0112-011A/2', '018E', '0190', '01A9', '0204', '0206', '0228', '0246', '0400', '0401', '0404', '0415', '042D', '0437', '044D', '0454', '04D6', '0510', '0511', '1D07', '1D08', '1D31', '1D32', '1E14-1E1C/2', '1EB8-1EC6/2', '1F18-1F1D', '1FC8', '1FC9', '2130', '2C7B', '2C88');
map('e', '00E8-00EB', '0113-011B/2', '018F', '01DD', '0205', '0207', '0229', '0247', '0258', '0259', '025A-025E', '0435', '0450', '0451', '04BC-04BF', '04D7-04DB', '1D49-1D4C', '1D62', '1D92-1D95', '1D9F', '1E15-1E1D/2', '1EB9-1EC7/2', '1F10-1F15', '1F72', '1F73', '2091', '2094', '212E', '212F', '2147', '2C78', '2C89');
map('F', '017F', '0191', '04FA', '04FB', '1E1E', '2031', '2132', '214E');
map('f', '017F', '0192', '0532', '0562', '1D6E', '1D82', '1DA0', '1E1F', '1E9B', '1E9C', '1E9D');
map('fn', '02A9');
map('G', '011C-0122/2', '0193', '01E4', '01E6', '01F4', '0262', '028B', '050C', '050D', '1D33', '1E20', '2141', '2CD2');
map('g', '011D-0123/2', '01E5', '01E7', '01F5', '0260', '0261', '0581', '1D4D', '1D77', '1D83', '1DA2', '1E21', '210A', '2CD3');
map('H', '0124', '0126', '01F6', '021E', '029C', '041D', '043D', '04A2-04A5', '04C7-04CA', '050A', '050B', '0528', '0529', '1D34', '1D78', '1E22-1E2A/2', '1F28-1F2F', '1F98-1F9F', '1FCA-1FCC', '210B-210D', '2C67', '2C75', '2C8E');
map('h', '0125', '0127', '021F', '0265-0267', '02AE-02B1', '0452', '045B', '0494', '0495', '04BA', '04BB', '0526', '0527', '1DA3', '1E23', '1E25-1E2B/2', '1E96', '2095', '210E', '210F', '2C68', '2C76', '2C8F');
map('I', '00CC-00CF', '0128-0130/2', '0196', '0197', '01CF', '0208', '020A', '026A', '0406', '0407', '04C0', '1D35', '1D7B', '1D7C', '1DA6', '1DA7', '1E2C', '1E2E', '1EC8', '1ECA', '1F38-1F3F', '1FD8-1FDB', '2110', '2111', '2C92', '2CD4');
map('i', '00EC-00EF', '0129-0131/2', '019A', '01D0', '0209', '020B', '0268', '0269', '0456', '0457', '1D09', '1D4E', '1D96', '1DA4', '1DA5', '1E2D', '1E2F', '1EC9', '1ECB', '1F30-1F37', '1F76', '1F77', '1FD0-1FD7', '2071', '2139', '2148', '2C93', '2CD5');
map('IJ', '0132');
map('ij', '0133');
map('J', '0134', '0248', '0408', '1D0A', '1D36');
map('j', '0135', '01F0', '0237', '0249', '025F', '029D', '02B2', '0458', '1DA1', '1DA8', '2149', '2C7C');
map('K', '0136', '0198', '01E8', '040C', '041A', '043A', '045C', '049A-049E', '04A0', '04A1', '04C3', '04C4', '051E', '051F', '1D0B', '1D37', '1E30-1E34/2', '212A', '2C69', '2C94');
map('k', '0137', '0138', '0199', '01E9', '029E', '049F', '1D4F', '1D84', '1E31-1E35/2', '2096', '2C6A', '2C95');
map('L', '0139-0141/2', '023D', '029F', '053C', '1D0C', '1D38', '1DAB', '1E36-1E3C/2', '2112', '2142', '2143', '2C60', '2C62', '2CD0', '2CD6');
map('l', '013A-0142/2', '0234', '026B-026D', '04CF', '056C', '0582', '1D85', '1DA9', '1DAA', '1E37-1E3D/2', '2097', '2113', '2C61', '2CD1', '2CD7');
map('LJ', '01C7');
map('Lj', '01C8');
map('lj', '01C9');
map('ls', '02AA');
map('lz', '02AB');
map('M', '041C', '043C', '04CD', '04CE', '1D0D', '1D39', '1E3E-1E42/2', '2133', '2C6E', '2C98');
map('m', '0271', '028D', '1D1F', '1D50', '1D5A', '1D6F', '1D86', '1DAC', '1DAD', '1E3F-1E43/2', '2098', '2C99');
map('N', '00D1', '0143-0147/2', '014A', '019D', '01F8', '0220', '0274', '040D', '0418', '0419', '0438', '0439', '045D', '048A', '048B', '04E2-04E5', '1D0E', '1D3A', '1D3B', '1DB0', '1E44-1E4A/2', '2115', '2135', '2C9A');
map('n', '00F1', '0144-0148/2', '0149', '014B', '019E', '01F9', '0235', '0271', '0273', '054C', '0564', '0572', '0578', '057C', '0580', '1D51', '1D70', '1D87', '1DAE', '1DAF', '1E45-1E4B/2', '1F20-1F27', '1F74', '1F75', '1F90-1F97', '1FC2-1FC7', '207F', '2099', '2C9B');
map('NJ', '01CA');
map('Nj', '01CB');
map('nj', '01CC');
map('O', '00D2-00D6', '00D8', '014C-0150/2', '019F', '01A0', '01D1', '01EA', '01EC', '01FE', '020C', '020E', '022A-0230/2', '0298', '041E', '043E', '0472', '047A', '04E6-04EA/2', '0555', '1D0F', '1D10', '1D3C', '1E4C-1E52/2', '1ECC-1EE2/2', '1F48-1F4D', '1FF8', '1FF9', '2C90', '2C9E');
map('o', '00F2-00F6', '00F8', '014D-0151/2', '01A1', '01D2', '01EB', '01ED', '01FF', '020D', '020F', '022B-0231/2', '0275', '0473', '047B', '04E7-04EB/2', '0585', '1D11-1D13', '1D16', '1D17', '1D52-1D55', '1D97', '1DB1', '1E4D-1E53/2', '1ECD-1EE3/2', '1F40-1F45', '1F78', '1F79', '2092', '2134', '2C7A', '2C91', '2C9F');
map('OE', '0152', '0276');
map('oe', '0153', '1D14');
map('OI', '01A2');
map('oi', '01A3');
map('Oy', '0478');
map('oy', '0479');
map('P', '00DE', '01A4', '01F7', '0420', '048E', '1D18', '1D29', '1D3E', '1E54', '1E56', '1FEC', '2117-2119', '2C63', '2CA2', '2CC0', '2CCE');
map('p', '00FE', '01A5', '01BF', '0440', '048F', '1D56', '1D68', '1D71', '1D7D', '1D88', '1E55', '1E57', '1FE4', '1FE5', '209A', '2CA3', '2CC1', '2CCF');
map('Q', '024A', '051A', '211A', '213A');
map('q', '024B', '02A0', '051B', '0563', '0566');
map('qp', '0239');
map('R', '0154-0158/2', '01A6', '0210', '0212', '024C', '0280', '0281', '02B6', '042F', '044F', '1D19', '1D1A', '1D3F', '1E58-1E5E/2', '211B-211D', '211F', '2C64', '2C84');
map('r', '0155-0159/2', '0211', '0213', '024D', '0279', '027A-027F', '02B3', '02B4', '02B5', '053B', '0550', '0552', '1D63', '1D72', '1D73', '1D89', '1E59-1E5F/2', '2C79', '2C85');
map('S', '015A-0160/2', '01A7', '0218', '0405', '0455', '054F', '1E60-1E68/2', '2C7E', '2C8A');
map('s', '015B-0161/2', '01A8', '0219', '023F', '0282', '1D74', '1D8A', '1DB3', '1E61-1E69/2', '209B', '2C8B');
map('T', '0162-0166/2', '01AC', '01AE', '021A', '023E', '0422', '0442', '04AC', '04AD', '050E', '050F', '1D1B', '1D40', '1E6A-1E70/2', '2CA6');
map('t', '0163-0167/2', '01AD', '021B', '0236', '0287', '0288', '0534', '0537', '0565', '0567', '1D57', '1D75', '1DB5', '1E6B-1E71/2', '1E97', '209C', '2C66', '2CA7');
map('tc', '02A8');
map('th', '1D7A');
map('ts', '02A6');
map('U', '00D9-00DC', '0168-0172/2', '01AF', '01D3-01DB/2', '0214', '0216', '0244', '0531', '054D', '1D1C', '1D1D', '1D41', '1D7E', '1D7F', '1E72-1E7A/2', '1EE4-1EF0/2', '2CD8');
map('u', '00F9-00FC', '0169-0173/2', '01B0', '01D4-01DC/2', '0215', '0217', '0289', '0574', '0576', '057D', '057E', '0587', '1D1E', '1D58', '1D59', '1D64', '1D99', '1DB6-1DB8', '1DBF', '1E73-1E7B/2', '1EE5-1EF1/2', '1F50-1F57', '1F7A', '1F7B', '1FE0-1FE3', '1FE6', '1FE7', '2CD9');
map('ue', '1D6B');
map('un', '057F');
map('V', '01B2', '0245', '0474', '0476', '1D20', '1E7C', '1E7E', '2123', '2C7D');
map('v', '028B', '028C', '02C5', '0475', '0477', '1D5B', '1D65', '1D8C', '1DB9', '1DBA', '1E7D', '1E7F', '2C71', '2C74');
map('W', '0174', '019C', '0460', '0461', '047C', '047E', '051C', '1D21', '1D42', '1E80-1E88/2', '2C72', '2CB0', '2CC2');
map('w', '0175', '026F', '0270', '02B7', '0428', '0429', '0448', '0449', '047D', '047F', '051D', '0561', '057A', '1E81-1E89/2', '1E98', '1F60-1F67', '1F7C', '1F7D', '1FA0-1FA7', '1FF2-1FF7', '2C73', '2CB1', '2CC3');
map('X', '04B2', '04FC', '04FE', '1E8A', '1E8C', '2CAC');
map('x', '00D7', '0425', '0445', '04B3', '04FD', '04FF', '1D61', '1D6A', '1D8D', '1E8B', '1E8D', '2093', '2CAD');
map('Y', '00DD', '0176', '0178', '01B3', '0232', '024E', '028F', '04AE-04B1', '1E8E', '1EF2-1EF8/2', '1EFE', '1F59-1F5F', '1FE8-1FEB', '2144', '2CA8');
map('y', '00FD', '00FF', '0177', '01B4', '0233', '024F', '028E', '02B8', '040E', '0423', '0443', '045E', '04EE-04F3', '1D5E', '1D67', '1E8F', '1E99', '1EF3-1EF9/2', '1EFF', '2CA9');
map('Z', '0179-017D/2', '01B5', '0224', '1D22', '1E90-1E94/2', '2124', '2128', '2C6B', '2C7F', '2C8C');
map('z', '017A-017E/2', '01B6', '0225', '0240', '0290', '0291', '1D76', '1D8E', '1DBB-1DBD', '1E91-1E95/2', '2C6C', '2C8D');
map('a/c', '2100');
map('A/S', '214D');
map('a/s', '2101');
map('°C', '2103');
map('°F', '2109');
map('CL', '2104');
map('c/o', '2105');
map('c/u', '2106');
map('lb', '2114');
map('No', '2116');
map('Rx', '211E');
map('SM', '2120');
map('TEL', '2121');
map('TM', '2122');
map('FAX', '213B');
map('PL', '214A');
map('&', '214B');
map('0', '07C0', '2070', '2080');
map('1', '07C1', '2081', '2488');
map('2', '01BB', '07C2', '2082', '2489');
map('3', '07C3', '2083', '248A', '2CC4', '2CC5', '2CCC', '2CCD');
map('4', '07C4', '2074', '2084', '248B');
map('5', '01BC-01BE', '07C5', '2075', '2085', '248C');
map('6', '07C6', '2076', '2086', '248D');
map('7', '07C7', '2077', '2087', '248E');
map('8', '07C8', '2078', '2088', '248F');
map('9', '07C9', '2079', '2089', '2490', '2CCA', '2CCB');
map('10', '2469', '2491');
map('11', '246A', '2492');
map('12', '246B', '2493');
map('13', '246C', '2494');
map('14', '246D', '2495');
map('15', '246E', '2496');
map('16', '246F', '2497');
map('17', '2470', '2498');
map('18', '2471', '2499');
map('19', '2472', '249A');
map('20', '2473', '249B');
map('(1)', '2460', '2474');
map('(2)', '2461', '2475');
map('(3)', '2462', '2476');
map('(4)', '2463', '2477');
map('(5)', '2464', '2478');
map('(6)', '2465', '2479');
map('(7)', '2466', '247A');
map('(8)', '2467', '247B');
map('(9)', '2468', '247C');
map('(10)', '247D');
map('(11)', '247E');
map('(12)', '247F');
map('(13)', '2480');
map('(14)', '2481');
map('(15)', '2482');
map('(16)', '2483');
map('(17)', '2484');
map('(18)', '2485');
map('(19)', '2486');
map('(20)', '2487');
map('(a)', '249C', '24D0');
map('(b)', '249D', '24D1');
map('(c)', '249E', '24D2');
map('(d)', '249F', '24D3');
map('(e)', '24A0', '24D4');
map('(f)', '24A1', '24D5');
map('(g)', '24A2', '24D6');
map('(h)', '24A3', '24D7');
map('(i)', '24A4', '24D8');
map('(j)', '24A5', '24D9');
map('(k)', '24A6', '24DA');
map('(l)', '24A7', '24DB');
map('(m)', '24A8', '24DC');
map('(n)', '24A9', '24DD');
map('(o)', '24AA', '24DE');
map('(p)', '24AB', '24DF');
map('(q)', '24AC', '24E0');
map('(r)', '24AD', '24E1');
map('(s)', '24AE', '24E2');
map('(t)', '24AF', '24E3');
map('(u)', '24B0', '24E4');
map('(v)', '24B1', '24E5');
map('(w)', '24B2', '24E6');
map('(x)', '24B3', '24E7');
map('(y)', '24B4', '24E8');
map('(z)', '24B5', '24E9');
map('(A)', '24B6');
map('(B)', '24B7');
map('(C)', '24B8');
map('(D)', '24B9');
map('(E)', '24BA');
map('(F)', '24BB');
map('(G)', '24BC');
map('(H)', '24BD');
map('(I)', '24BE');
map('(J)', '24BF');
map('(K)', '24C0');
map('(L)', '24C1');
map('(M)', '24C2');
map('(N)', '24C3');
map('(O)', '24C4');
map('(P)', '24C5');
map('(Q)', '24C6');
map('(R)', '24C7');
map('(S)', '24C8');
map('(T)', '24C9');
map('(U)', '24CA');
map('(V)', '24CB');
map('(W)', '24CC');
map('(X)', '24CD');
map('(Y)', '24CE');
map('(Z)', '24CF');
map('(0)', '24EA');
map('(11)', '24EB');
map('(12)', '24EC');
map('(13)', '24ED');
map('(14)', '24EE');
map('(15)', '24EF');
map('(16)', '24F0');
map('(17)', '24F1');
map('(18)', '24F2');
map('(19)', '24F3');
map('(20)', '24F4');
map('(1)', '24F5');
map('(2)', '24F6');
map('(3)', '24F7');
map('(4)', '24F8');
map('(5)', '24F9');
map('(6)', '24FA');
map('(7)', '24FB');
map('(8)', '24FC');
map('(9)', '24FD');
map('(10)', '24FE');
map('(0)', '24FF');
map('0/3', '2189');
map('1/', '215F');
map('1/3', '2153');
map('1/5', '2155');
map('1/6', '2159');
map('1/7', '2150');
map('1/8', '215B');
map('1/9', '2151');
map('1/10', '2152');
map('2/3', '2154');
map('2/5', '2156');
map('3/5', '2157');
map('3/8', '215C');
map('4/5', '2158');
map('5/6', '215A');
map('5/8', '215D');
map('7/8', '215E');
map('I', '2160');
map('II', '2161');
map('III', '2162');
map('IV', '2163');
map('V', '2164');
map('VI', '2165');
map('VII', '2166');
map('VIII', '2167');
map('IX', '2168');
map('X', '2169');
map('XI', '216A');
map('XII', '216B');
map('L', '216C');
map('C', '216D', '2183', '2185');
map('D', '216E');
map('M', '216F');
map('i', '2170');
map('ii', '2171');
map('iii', '2172');
map('iv', '2173');
map('v', '2174');
map('vi', '2175');
map('vii', '2176');
map('viii', '2177');
map('ix', '2178');
map('x', '2179');
map('xi', '217A');
map('xii', '217B');
map('l', '217C');
map('c', '217D', '2184');
map('D', '217E');
map('m', '217F');
map('"', '201C-201F');
map("'", '00B4', '0092', '02BB-02BD', '02DD', '02CA', '02CB', '02CE', '02CF', '2018-201B', '2032', '2035');
map("''", '2033', '2036');
map("'''", '2034', '2037');
map("''''", '2057');
map('-', '02D7', '2010-2015');
map('<', '02C2');
map('>', '02C3');
map('^', '02C4', '02C6');
map('+', '02D6', '207A', '208A');
map('-', '207B', '208B');
map('=', '207C', '208C');
map('(', '207D', '208D');
map(')', '207E', '208E');
map('.', '2024');
map('..', '2025');
map('...', '2026');
map('!!', '203C');
map('!?', '203D', '2049');
map('??', '2047');
map('?!', '2048');
map('*', '204E', '2055');
map(';', '204F');
map('~', '2053');
map('/', '2CC6', '2CC7');

//Finished Through: 2CD9

if(!validate()) {
  process.exit(1);
}

for(const replacement of rawKeys) {
  const patterns: SortablePattern[] = rawMappings[replacement];
  const pattern = `[${_.join(_.map(_.sortBy(patterns, 'index'), 'pattern'), '')}]`;
  mappings.push({ replacement, pattern });
}

const suffix: string = `\n\nexport const stripAccents = (str) => mappings.reduce((s, [replacement, pattern]) => s.replace(pattern, replacement), str);\n`;

const mainContent: string = `const mappings = [\n${mappings.map(({ replacement, pattern }) => `  [${quote(replacement)}, /(${pattern})/g]`).join(',\n')}\n];`;

fs.writeFileSync(path.join(__dirname, '../lib/accents.mjs'), `${mainContent}${suffix}`, { encoding: 'utf8' });

process.stdout.write(boldGreen(`Successfully updated accents.mjs`));

process.exit(0);
