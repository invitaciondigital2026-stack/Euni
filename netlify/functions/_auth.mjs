import crypto from 'node:crypto';
const COOKIE='admin_session', AGE=60*60*12;
const secret=()=>process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_PASSWORD||'CHANGE_ME';
export function sign(payload){const body=Buffer.from(JSON.stringify({...payload,exp:Math.floor(Date.now()/1000)+AGE})).toString('base64url');const sig=crypto.createHmac('sha256',secret()).update(body).digest('base64url');return `${body}.${sig}`;}
export function verify(req){const raw=req.headers.get('cookie')||'';const m=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));if(!m)return false;const token=decodeURIComponent(m.slice(COOKIE.length+1)),[body,sig]=token.split('.');if(!body||!sig)return false;const exp=crypto.createHmac('sha256',secret()).update(body).digest('base64url');if(sig.length!==exp.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(exp)))return false;try{return JSON.parse(Buffer.from(body,'base64url').toString()).exp>Math.floor(Date.now()/1000)}catch{return false;}}
export const cookie=t=>`${COOKIE}=${encodeURIComponent(t)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${AGE}`;
export const clear=`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
