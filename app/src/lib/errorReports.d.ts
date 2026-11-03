export function safePage(path:string):string;
export function classifyAppError(error:unknown,fallback?:string):string;
export function reportAppError(kind:string):boolean;
export function createErrorReporter(options?:{enabled?:boolean;send?:(event:Record<string,string>)=>unknown;now?:()=>number;route?:()=>string;revision?:string;browser?:string;device?:string}):(kind:string)=>boolean;
export function installErrorReports(options?:{enabled?:boolean;revision?:string}):()=>void;
