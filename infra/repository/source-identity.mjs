import {createHash} from 'node:crypto';
// Git text checkouts can differ by CRLF/LF; binary bytes must remain exact.
export function canonicalSource(bytes){return bytes.includes(0)?bytes:Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'));}
export function sourceHash(bytes){return createHash('sha256').update(canonicalSource(bytes)).digest('hex');}
