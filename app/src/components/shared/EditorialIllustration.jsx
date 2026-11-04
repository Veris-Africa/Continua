const artwork={research:'research-companion',watchlist:'watchlist-garden',community:'shared-perspectives'};
/** Original static artwork. Surrounding copy conveys meaning when decorative. */
export function EditorialIllustration({scene='research',alt='',className=''}){
 return <img src={'/illustrations/'+artwork[scene]+'.svg'} alt={alt} aria-hidden={alt?'false':'true'} width="320" height="220" loading="lazy" decoding="async" className={'editorial-illustration '+className}/>;
}
