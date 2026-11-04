// Shared date-only contract for NSE daily observations. No holiday inference.
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'});
export function marketDate(value=new Date()){
 const date=value instanceof Date?value:new Date(value);
 if(!Number.isFinite(date.getTime()))return null;
 const parts=Object.fromEntries(formatter.formatToParts(date).map(part=>[part.type,part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validDateOnly(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function observationDate(row){
 if(row?.date!=null)return validDateOnly(row.date)?row.date:null;
 if(typeof row?.timestamp==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.timestamp))return validDateOnly(row.timestamp)?row.timestamp:null;
 return typeof row?.timestamp==='string'&&validDateOnly(row.timestamp.slice(0,10))&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(row.timestamp)?marketDate(row.timestamp):null;
}
