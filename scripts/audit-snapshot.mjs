// Independent audit against cached raw API responses, never packaged.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const cache=process.argv[2]??'/tmp/random-pokemon-pokeapi-cache';
const memo=new Map();
const raw=key=>{if(!memo.has(key))memo.set(key,JSON.parse(readFileSync(`${cache}/${key.replaceAll('/','-')}.json`)));return memo.get(key);};
const snapshot=JSON.parse(readFileSync('data/pokeapi.json'));
const hashes=JSON.parse(readFileSync('data/pokeapi-sha256.json'));
for(const [key,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(`${cache}/${key.replaceAll('/','-')}.json`)).digest('hex'),hash);
assert.equal(snapshot.records.length,1025);
for(const record of snapshot.records){
 const p=raw(`pokemon/${record.id}`),s=raw(`pokemon-species/${record.id}`);
 assert.deepEqual(record.abilities,p.abilities.map(a=>({name:a.ability.name,is_hidden:a.is_hidden,slot:a.slot})));
 assert.equal(record.is_legendary,s.is_legendary);assert.equal(record.is_mythical,s.is_mythical);
 assert(!(record.is_legendary&&record.is_mythical));
 const types=new Set();
 for(const item of p.moves){const m=raw(`move/${item.move.url.split('/').filter(Boolean).at(-1)}`);if(m.damage_class.name!=='status')types.add(m.type.name);}
 assert.deepEqual(record.learnableAttackTypes,[...types].sort());
}
const pika=raw('pokemon/25');
const ground=pika.moves.map(m=>raw(`move/${m.move.url.split('/').filter(Boolean).at(-1)}`)).filter(m=>m.type.name==='ground'&&m.damage_class.name!=='status');
assert(ground.length>0);
console.log(JSON.stringify({auditedSpecies:1025,hashedResponses:Object.keys(hashes).length,pikachuAbilities:pika.abilities,pikachuGroundMoves:ground.map(m=>({name:m.name,type:m.type.name,damageClass:m.damage_class.name})),legendary:snapshot.records.filter(p=>p.is_legendary).length,mythical:snapshot.records.filter(p=>p.is_mythical).length},null,2));
