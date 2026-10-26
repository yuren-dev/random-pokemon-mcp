import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const inspector=JSON.parse(execFileSync(process.execPath,['node_modules/@modelcontextprotocol/inspector/clients/cli/build/index.js','--cli','node','dist/index.js','--method','tools/list'],{encoding:'utf8'}));
assert.equal(inspector.tools.length,5);
for (const [name,args] of [
 ['get_pokemon',{pokemon:'pikachu'}],
 ['get_type_effectiveness',{attacking:'fire',defending:['grass']}],
 ['random_team',{seed:'inspector'}],
 ['analyze_team',{text:'Pikachu\n- Thunderbolt'}],
 ['calc_damage',{attacker:6,defender:3,moveType:'fire',power:90,category:'special'}]
]) {
 const cliArgs=Object.entries(args).flatMap(([key,value])=>['--tool-arg',`${key}=${typeof value==='string'?value:JSON.stringify(value)}`]);
 const result=JSON.parse(execFileSync(process.execPath,['node_modules/@modelcontextprotocol/inspector/clients/cli/build/index.js','node','dist/index.js','--method','tools/call','--tool-name',name,...cliArgs],{encoding:'utf8'}));
 assert(!result.isError,JSON.stringify(result));
}

const client=new Client({name:'smoke',version:'1.0.0'});await client.connect(new StdioClientTransport({command:process.execPath,args:['dist/index.js']}));
try {
const names=(await client.listTools()).tools.map(t=>t.name).sort();assert.deepEqual(names,['analyze_team','calc_damage','get_pokemon','get_type_effectiveness','random_team'].sort());
async function call(name,args,error=false){const r=await client.callTool({name,arguments:args});assert.equal(Boolean(r.isError),error,JSON.stringify(r));return error?r:JSON.parse(r.content[0].text);}
assert.equal((await call('get_pokemon',{pokemon:'Pikachu'})).id,25);
assert.equal((await call('get_pokemon',{pokemon:1025})).name,'pecharunt');
assert.equal((await call('get_type_effectiveness',{attacking:'rock',defending:['fire','flying']})).multiplier,4);
assert.equal((await call('get_type_effectiveness',{attacking:'electric',defending:['ground','flying']})).multiplier,0);
const a=await call('random_team',{seed:'repeat',generations:[1],types:['water']});assert.deepEqual(a,await call('random_team',{seed:'repeat',generations:[1],types:['water']}));assert.equal(new Set(a.team.map(p=>p.id)).size,6);assert(a.team.every(p=>p.generation===1&&p.types.includes('water')));
const analysis=await call('analyze_team',{text:'Sparky (Pikachu) @ Light Ball\nAbility: Static\n- Thunderbolt\n\nCharizard\n- Flamethrower'});assert.equal(analysis.members.length,2);assert.equal(analysis.defensiveCounts.rock.fourTimes,1);
const d=await call('calc_damage',{attacker:'charizard',defender:'venusaur',moveType:'fire',power:90,category:'special'});assert.match(d.limitations,/未计入项.*天气\/场地\/道具\/特性\/太晶/);assert.equal(d.damage.rolls.length,16);assert(d.damage.min<=d.damage.max);
assert.equal((await call('calc_damage',{attacker:25,defender:50,moveType:'electric',power:90,category:'special'})).damage.max,0);
for(const [n,args] of [['get_pokemon',{pokemon:'no-such-pokemon'}],['get_type_effectiveness',{attacking:'invalid'}],['analyze_team',{text:'   '}],['random_team',{includeLegendary:false}],['calc_damage',{attacker:6,defender:3,moveType:'fire',power:0,category:'special'}],['calc_damage',{attacker:'unknown',defender:1,moveType:'fire',power:90,category:'special'}]]){const r=await call(n,args,true);assert(r.content[0].text.length>0);if(n==='calc_damage')assert.match(r.content[0].text,/未计入项/);}
assert.equal((await call('get_pokemon',{pokemon:1})).id,1);
const dex=JSON.parse(readFileSync('data/pokemon.json','utf8'));assert.equal(dex.length,1025);assert.equal(new Set(dex.map(p=>p.id)).size,1025);
const {TYPES_18,effectiveness}=await import('../dist/type-chart.js');assert.equal(TYPES_18.length,18);for(const a of TYPES_18)for(const b of TYPES_18)assert([0,0.5,1,2].includes(effectiveness(a,b)));
console.log('PASS: Inspector tools/list=5; all five calls; readable errors and recovery; deterministic six; damage declarations; 1025 species; 18x18 chart.');
}finally{await client.close();}
