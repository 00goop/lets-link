import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../server/store.js';
import { createApp } from '../server/app.js';
import { geographicCenter } from '../shared/geo.js';

test('geographic center handles weighted points and the date line',()=>{
  const center=geographicCenter([{lat:0,lng:179},{lat:0,lng:-179}]);
  assert.ok(Math.abs(Math.abs(center.lng)-180)<0.001);
  assert.ok(Math.abs(center.lat)<0.001);
  assert.ok(geographicCenter([{lat:0,lng:0,weight:3},{lat:0,lng:20}]).lng<10);
  for(const points of [[],[{lat:91,lng:0}],[{lat:0,lng:0,weight:0}],[{lat:NaN,lng:0}],[{lat:0,lng:0},{lat:0,lng:180}]])assert.throws(()=>geographicCenter(points));
});

test('accounts, authorization, invitations and persisted sessions',async(t)=>{
  const directory=mkdtempSync(join(tmpdir(),'lets-link-test-'));
  const path=join(directory,'test.sqlite');
  let db=openStore(path),server=createApp({db}).listen(0,'127.0.0.1');
  await once(server,'listening');
  let base=`http://127.0.0.1:${server.address().port}`;
  const close=()=>new Promise(resolve=>server.close(resolve));
  t.after(async()=>{await close();db.close();rmSync(directory,{recursive:true,force:true});});
  async function call(route,{cookie,body,method=body?'POST':'GET',origin}={}) {
    return fetch(base+route,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  }
  async function register(name) {
    const response=await call('/api/auth/register',{body:{email:`${name}@example.test`,username:name,password:'correct horse battery',full_name:name}});
    assert.equal(response.status,201);
    assert.match(response.headers.get('set-cookie'),/HttpOnly/);
    const cookie=response.headers.get('set-cookie').split(';')[0];
    const data=await response.json();assert.equal(data.user.password_hash,undefined);
    return cookie;
  }
  assert.equal((await call('/api/parties')).status,401);
  const alice=await register('alice'),bob=await register('bob'),outsider=await register('outsider');
  assert.equal((await call('/api/auth/login',{body:{email:'alice@example.test',password:'wrong'}})).status,401);
  assert.equal((await call('/api/auth/login',{body:{email:'alice@example.test',password:'correct horse battery'}})).status,200);
  const created=await call('/api/parties',{cookie:alice,body:{title:'Museum afternoon',type:'educational',max_size:2}});
  assert.equal(created.status,201);const {party}=await created.json();
  assert.equal((await call(`/api/parties/${party.id}`,{cookie:bob})).status,404);
  assert.equal((await call('/api/parties/join',{cookie:bob,body:{code:party.join_code}})).status,200);
  assert.equal((await call('/api/parties/join',{cookie:bob,body:{code:party.join_code}})).status,200);
  assert.equal((await call('/api/parties/join',{cookie:outsider,body:{code:party.join_code}})).status,409);
  assert.equal((await call(`/api/parties/${party.id}/location`,{cookie:outsider,method:'PATCH',body:{lat:33,lng:-84}})).status,404);
  assert.equal((await call(`/api/parties/${party.id}/location`,{cookie:alice,method:'PATCH',body:{lat:33,lng:-84,name:'Shared location'}})).status,200);
  assert.equal((await call('/api/parties',{cookie:alice,body:{title:'test',type:'dining'},origin:'https://evil.test'})).status,403);
  assert.equal((await call('/api/users/me',{cookie:alice,method:'PATCH',body:{full_name:'Alice Updated',bio:'Museum lover',phone:'private',role:'admin'}})).status,200);
  assert.equal((await call(`/api/parties/${party.id}`,{cookie:bob,method:'PATCH',body:{title:'Stolen'}})).status,403);
  assert.equal((await call(`/api/parties/${party.id}`,{cookie:alice,method:'PATCH',body:{title:'Updated outing'}})).status,200);
  assert.equal((await call(`/api/parties/${party.id}`,{cookie:alice,method:'PATCH',body:{location_lat:91,location_lng:0}})).status,400);
  const state=await(await call('/api/state',{cookie:bob})).json();
  assert.equal(state.partyMembers.length,2);
  assert.equal(state.parties[0].title,'Updated outing');
  assert.equal(state.users.find(u=>u.username==='alice').phone,undefined);
  assert.equal(state.users.find(u=>u.username==='alice').role,'user');
  assert.equal(state.users.find(u=>u.username==='alice').email,undefined);
  await close();db.close();db=openStore(path);server=createApp({db}).listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;
  const persisted=await(await call('/api/users/me',{cookie:alice})).json();
  assert.equal(persisted.user.full_name,'Alice Updated');
  assert.equal(persisted.user.bio,'Museum lover');
  assert.equal((await(await call('/api/parties',{cookie:alice})).json()).parties.length,1);
  assert.equal((await call('/api/auth/logout',{cookie:alice,method:'POST'})).status,204);
  assert.equal((await call('/api/users/me',{cookie:alice})).status,401);
});
