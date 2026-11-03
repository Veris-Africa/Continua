import {metrics} from './observability.js';
import {poolSnapshot} from './poolMetrics.js';
import {queryVolume} from './queryVolume.js';
import {releaseInfo} from '../release.js';
import {evaluateSignals} from './alertPolicy.js';
// No SQL, Redis commands or provider requests are issued by this diagnostic.
export function operationalSnapshot({durability=false}={}){
 return {release:releaseInfo(),uptimeSeconds:Math.floor(process.uptime()),memory:process.memoryUsage(),
  requests:metrics.snapshot(),signals:evaluateSignals({requests:metrics.snapshot(),payments:{enabled:durability}}),pools:poolSnapshot(),sqlVolume:queryVolume.snapshot(),
  paymentDurability:{enabled:durability,metrics:durability?'use private payment-operations endpoint':'unavailable_disabled'},
  providerUsage:{status:'unavailable',reason:'Neon billed usage requires a dated provider receipt; SQL value estimates are not billed transfer'},
  coverage:{http:'early request logger including denied routes',database:'promise and callback pool queries; streaming excluded',auth:'managed SDK operations; jose JWKS internal HTTP excluded',cache:'cache get/set/delete/rate counters; fallback may hide remote failure',engine:'Python calculation and queue timing; Node formulas covered by route duration',background:'existing independent wake-up; no new timer',coldStart:'first 60 process seconds only; provider wake/network delay requires independent probe'}};
}
