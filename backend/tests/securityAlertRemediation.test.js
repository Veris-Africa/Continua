import {rateLimit} from 'express-rate-limit';
import {it,expect} from 'vitest';
import express from 'express';
import {createOwnedFunctionRouter} from '../src/data/functionRoutes.js';
import {invalidSession} from '../src/auth/authErrors.js';
import {errorHandler} from '../src/api/middleware/errorHandler.js';
import {createElement} from 'react';
import {render,toPlainText} from '@react-email/render';

it('bounds authentication work before owned function verification',async()=>{
 let checks=0;const app=express();app.use(rateLimit({windowMs:60000,limit:1000,standardHeaders:false,legacyHeaders:false}));app.use(createOwnedFunctionRouter({database:{query:async()=>{throw Error('Must not query');}},verifyAccess:async()=>{checks++;throw invalidSession();}}));app.use(errorHandler);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port+'/check-price-alerts';
 try{
  for(let i=0;i<120;i++)expect((await fetch(url,{method:'POST',headers:{'x-user-token':'synthetic-invalid'}})).status).toBe(401);
  expect((await fetch(url,{method:'POST',headers:{'x-user-token':'synthetic-invalid'}})).status).toBe(429);expect(checks).toBe(120);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
it('renders HTML and plaintext emails after removal of vulnerable deepmerge',async()=>{
 const html=await render(createElement('div',null,createElement('h1',null,'Continua verification'),createElement('a',{href:'https://example.invalid/verify'},'Verify email')));
 expect(html).toContain('Continua verification');expect(toPlainText(html)).toContain('Verify email');expect(toPlainText(html)).toContain('https://example.invalid/verify');
 const {convert}=await import('html-to-text');const text=convert('<p>Safe text</p>',JSON.parse('{"__proto__":{"polluted":true},"wordwrap":80}'));
 expect(text).toBe('Safe text');expect({}.polluted).toBeUndefined();
});
