import express from 'express';
import cors from 'cors';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { openStore } from './store.js';
import { geographicCenter } from '../shared/geo.js';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const route = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
function text(value, name, max = 200, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw fail(`Invalid ${name}`);
  return value.trim();
}
const baseUser = user => ({ id:user.id, email:user.email, username:user.username, full_name:user.full_name, role:'user', profile_picture_url:`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}` });

export function createApp({ db = openStore(), fetchImpl = fetch, origin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173', apiKey = process.env.GEMINI_API_KEY, secure = process.env.NODE_ENV === 'production' } = {}) {
  const app = express();
  const publicUser = user => ({...baseUser(user),...JSON.parse(db.prepare('SELECT data FROM profiles WHERE user_id=?').get(user.id)?.data || '{}')});
  app.disable('x-powered-by');
  app.use(cors({ origin, credentials: true }));
  app.use((req,res,next) => {
    res.set('Cache-Control','no-store');
    res.set('X-Content-Type-Options','nosniff');
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('origin') && req.get('origin') !== origin) return res.status(403).json({error:'Origin not allowed'});
    next();
  });
  app.use(express.json({limit:'32kb'}));
  const requests = new Map();
  app.use('/api', (req,res,next) => {
    const now = Date.now();
    for (const [key,value] of requests) if (now > value.until) requests.delete(key);
    const key = req.ip;
    if (requests.size >= 10000 && !requests.has(key)) return res.status(429).json({error:'Try again later'});
    const state = requests.get(key) || {count:0,until:now+60000};
    requests.set(key,state);
    if (++state.count > 100) return res.status(429).json({error:'Too many requests'});
    next();
  });
  const cookieOptions = {httpOnly:true,secure,sameSite:'lax',path:'/'};
  function token(req) { return req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('session='))?.slice(8) || ''; }
  function userFor(req) { return db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?').get(hash(token(req)),Date.now()); }
  function issueSession(user,res) {
    const value = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(value),user.id,Date.now()+7*86400000);
    res.cookie('session',value,{...cookieOptions,maxAge:7*86400000});
  }
  app.get('/api/health', (req,res) => res.json({status:'ok'}));
  app.post('/api/auth/register',route(async (req,res) => {
    const email=text(req.body?.email,'email',254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('Invalid email');
    const password=req.body?.password;
    if(typeof password!=='string'||password.length<12||password.length>128) throw fail('Use a password of 12-128 characters');
    const username=text(req.body.username || email.split('@')[0],'username',40);
    if(!/^[a-zA-Z0-9_.-]{2,40}$/.test(username)) throw fail('Username must be 2-40 letters, digits, dots, underscores or hyphens');
    const fullName=text(req.body.full_name || username,'full name',100);
    const salt=randomBytes(16).toString('hex');
    const passwordHash=(await derive(password,salt,64)).toString('hex');
    const user={id:randomUUID(),email,username,full_name:fullName};
    try {db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(user.id,email,username,fullName,passwordHash,salt);}
    catch(err) {if(String(err.message).includes('UNIQUE')) throw fail('Account already exists',409); throw err;}
    issueSession(user,res); res.status(201).json({user:publicUser(user)});
  }));
  app.post('/api/auth/login',route(async(req,res)=>{
    const email=text(req.body?.email,'email',254).toLowerCase();
    const password=req.body?.password;
    if(typeof password!=='string'||password.length>128) throw fail('Invalid credentials',401);
    const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const candidate=await derive(password,user?.salt || 'invalid-account-salt',64);
    if(!user || !timingSafeEqual(candidate,Buffer.from(user.password_hash,'hex'))) throw fail('Invalid credentials',401);
    issueSession(user,res); res.json({user:publicUser(user)});
  }));
  app.post('/api/auth/logout',(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token(req)));res.clearCookie('session',cookieOptions);res.status(204).end();});
  app.use('/api',(req,res,next)=>{req.user=userFor(req);if(!req.user)return res.status(401).json({error:'Sign in required'});next();});
  app.get('/api/users/me',(req,res)=>res.json({user:publicUser(req.user)}));
  app.patch('/api/users/me',(req,res,next)=>{try{
    const profile={};
    for(const field of ['bio','location','interests','phone'])profile[field]=text(req.body?.[field]||'',field,1000,false);
    const name=text(req.body?.full_name||req.user.full_name,'full name',100);
    db.prepare('UPDATE users SET full_name=? WHERE id=?').run(name,req.user.id);
    db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(req.user.id,JSON.stringify(profile));
    res.json({user:publicUser({...req.user,full_name:name})});
  }catch(err){next(err);}});
  function partyRecord(row) { return {...JSON.parse(row.data),id:row.id,host_id:row.host_id,join_code:row.join_code,member_ids:db.prepare('SELECT user_id FROM members WHERE party_id=?').all(row.id).map(m=>m.user_id)}; }
  function ownedParty(id,userId) {
    const row=db.prepare('SELECT parties.* FROM parties JOIN members ON members.party_id=parties.id WHERE parties.id=? AND members.user_id=?').get(id,userId);
    if(!row)throw fail('Party not found',404);return row;
  }
  const partiesFor = userId => db.prepare('SELECT parties.* FROM parties JOIN members ON members.party_id=parties.id WHERE members.user_id=?').all(userId).map(partyRecord);
  app.get('/api/parties',(req,res)=>res.json({parties:partiesFor(req.user.id)}));
  app.get('/api/state',(req,res)=>{
    const parties=partiesFor(req.user.id), partyMembers=[], users=new Map([[req.user.id,publicUser(req.user)]]);
    for(const party of parties) for(const member of db.prepare('SELECT * FROM members WHERE party_id=?').all(party.id)) {
      partyMembers.push({...member,status:'active'});
      const user=publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(member.user_id));
      if(user.id!==req.user.id){delete user.email;delete user.phone;}
      users.set(user.id,user);
    }
    res.json({user:publicUser(req.user),users:[...users.values()],parties,partyMembers});
  });
  app.post('/api/parties',(req,res,next)=>{try{
    const title=text(req.body?.title,'title',100), type=text(req.body.type,'type',40);
    if(!['recreational','dining','family_vacation','entertainment','shopping','educational'].includes(type))throw fail('Invalid party type');
    const maxSize=Number(req.body.max_size||10);
    if(!Number.isInteger(maxSize)||maxSize<2||maxSize>100)throw fail('Party size must be 2-100');
    const data={title,type,max_size:maxSize,status:'planning',created_at:new Date().toISOString()};
    for(const field of ['description','scheduled_date','location_name','location_address'])data[field]=text(req.body[field]||'',field,1000,false);
    const id=randomUUID(),joinCode=randomBytes(6).toString('hex').toUpperCase();
    db.exec('BEGIN');
    try{db.prepare('INSERT INTO parties VALUES(?,?,?,?)').run(id,req.user.id,joinCode,JSON.stringify(data));db.prepare('INSERT INTO members(id,party_id,user_id) VALUES(?,?,?)').run(randomUUID(),id,req.user.id);db.exec('COMMIT');}catch(err){db.exec('ROLLBACK');throw err;}
    res.status(201).json({party:partyRecord(db.prepare('SELECT * FROM parties WHERE id=?').get(id))});
  }catch(err){next(err);}});
  app.post('/api/parties/join',(req,res,next)=>{try{
    const code=text(req.body?.code,'invitation code',20).toUpperCase();
    const row=db.prepare('SELECT * FROM parties WHERE join_code=?').get(code);
    if(!row)throw fail('Invitation not found',404);
    const party=partyRecord(row);
    if(!party.member_ids.includes(req.user.id)){
      if(party.member_ids.length>=party.max_size)throw fail('Party is full',409);
      db.prepare('INSERT INTO members(id,party_id,user_id) VALUES(?,?,?)').run(randomUUID(),row.id,req.user.id);
    }
    res.json({party:partyRecord(row)});
  }catch(err){next(err);}});
  app.get('/api/parties/:id',(req,res,next)=>{try{res.json({party:partyRecord(ownedParty(req.params.id,req.user.id))});}catch(err){next(err);}});
  app.patch('/api/parties/:id',(req,res,next)=>{try{
    const row=ownedParty(req.params.id,req.user.id);
    if(row.host_id!==req.user.id)throw fail('Only the host can update the party',403);
    const data=JSON.parse(row.data);
    for(const field of ['title','description','location_name','location_address','scheduled_date'])if(req.body[field]!==undefined)data[field]=text(req.body[field],field,1000,field==='title');
    if(req.body.status!==undefined){if(!['planning','confirmed','completed'].includes(req.body.status))throw fail('Invalid status');data.status=req.body.status;}
    if(req.body.location_lat!==undefined||req.body.location_lng!==undefined){geographicCenter([{lat:req.body.location_lat,lng:req.body.location_lng}]);data.location_lat=req.body.location_lat;data.location_lng=req.body.location_lng;}
    db.prepare('UPDATE parties SET data=? WHERE id=?').run(JSON.stringify(data),row.id);
    res.json({party:partyRecord({...row,data:JSON.stringify(data)})});
  }catch(err){next(err.status?err:fail('Invalid party update'));}});
  app.patch('/api/parties/:id/location',(req,res,next)=>{try{
    ownedParty(req.params.id,req.user.id);
    const {lat,lng}=req.body||{};geographicCenter([{lat,lng}]);
    db.prepare('UPDATE members SET location_lat=?,location_lng=?,location_name=? WHERE party_id=? AND user_id=?').run(lat,lng,text(req.body.name||'','location name',200,false),req.params.id,req.user.id);
    res.json({success:true});
  }catch(err){next(err.status?err:fail(err.message));}});
  async function recommend(prompt) {
    if(!apiKey)throw fail('Gemini is not configured',503);
    const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
    const response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}]}),signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw fail('Recommendation provider unavailable',502);
    const payload=await response.json();
    const answer=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n').trim();
    if(!answer)throw fail('Recommendation provider returned no suggestions',502);
    return answer;
  }
  app.post('/api/gemini',route(async(req,res)=>res.json({text:await recommend(text(req.body?.prompt,'prompt',4000))})));
  app.post('/api/venues/recommend',route(async(req,res)=>{
    const party=ownedParty(text(req.body?.party_id,'party ID',64),req.user.id);
    const points=db.prepare('SELECT location_lat AS lat, location_lng AS lng FROM members WHERE party_id=? AND location_lat IS NOT NULL').all(party.id);
    let center;try{center=geographicCenter(points);}catch(err){throw fail(err.message);}
    const preferences=text(req.body.preferences||'','preferences',1000,false);
    const answer=await recommend(`Suggest meeting venue categories near ${center.lat}, ${center.lng} for ${JSON.parse(party.data).type}. Preferences: ${preferences}. Label unverified names as suggestions. Do not claim current availability or exact travel-time fairness.`);
    res.json({center,text:answer,verified_venues:false});
  }));
  app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found'}));
  app.use((err,req,res,next)=>{const status=err.status||502;res.status(status).json({error:status>=500?'Service temporarily unavailable':err.message});});
  return app;
}
