import {useEffect,useState} from 'react';
/** Public market polling can pause; session and ownership checks remain separate. */
export function usePageVisible(){
 const [visible,setVisible]=useState(()=>document.visibilityState==='visible');
 useEffect(()=>{const update=()=>setVisible(document.visibilityState==='visible');document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return visible;
}
