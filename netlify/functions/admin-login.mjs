import { sign,cookie } from './_auth.mjs';
export default async req=>{if(req.method!=='POST')return new Response('Method not allowed',{status:405});let b;try{b=await req.json()}catch{return Response.json({error:'Solicitud inválida.'},{status:400})}if(!process.env.ADMIN_PASSWORD||String(b.password||'')!==process.env.ADMIN_PASSWORD)return Response.json({error:'Contraseña incorrecta.'},{status:401});return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Set-Cookie':cookie(sign({role:'admin'}))}})};
export const config={path:'/.netlify/functions/admin-login'};
