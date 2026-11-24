import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const app = express();
const upstream = 'https://ntunhs-course-system-web.onrender.com';
const routes = /^\/api\/(health|auth\/(login|register|me|completed-courses\/toggle)|courses(?:\/meta|\/import|\/\d+)?|schedule(?:\/share|\/shared\/[a-f0-9]+|\/\d+)?)$/;
const dist = fileURLToPath(new URL('../client/dist/', import.meta.url));
app.disable('x-powered-by');
app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"});
  next();
});
app.get('/healthz', (_req,res)=>res.json({ok:true}));
app.use('/api', express.raw({type:()=>true,limit:'1mb'}), async (req,res)=>{
  res.set('Cache-Control','no-store');
  const url = new URL(req.originalUrl, upstream);
  if(url.origin!==upstream || !routes.test(url.pathname)) return res.status(404).json({error:'Unknown API route'});
  if(!['GET','POST','PUT','DELETE'].includes(req.method)) return res.sendStatus(405);
  const ownOrigin=process.env.RENDER_EXTERNAL_URL || 'http://localhost:'+ (process.env.PORT||3001);
  if(req.method!=='GET' && req.get('origin') && req.get('origin')!==ownOrigin) return res.status(403).json({error:'Cross-origin request refused'});
  const headers={Accept:'application/json'};
  if(req.get('content-type')) headers['Content-Type']=req.get('content-type');
  if(req.get('authorization')) headers.Authorization=req.get('authorization');
  try {
    const result=await fetch(upstream+url.pathname+url.search,{method:req.method,headers,body:req.method==='GET'?undefined:req.body,redirect:'manual',signal:AbortSignal.timeout(90000)});
    if(result.status>=300 && result.status<400) return res.status(502).json({error:'Unexpected upstream redirect'});
    res.status(result.status).set('Content-Type',result.headers.get('content-type')||'application/json');
    if(result.body) Readable.fromWeb(result.body).on('error',()=>res.destroy()).pipe(res);
    else res.end();
  } catch {
    if(!res.headersSent) res.status(502).json({error:'原系統暫時無法連線，請稍後重試。'});
    else res.end();
  }
});
app.use(express.static(dist,{index:'index.html'}));
app.use((_req,res)=>res.sendStatus(404));
app.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('NTUNHS hosted frontend ready'));
