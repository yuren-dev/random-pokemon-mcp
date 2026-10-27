import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const client=new Client({name:'damage-check',version:'0.3.0'});
await client.connect(new StdioClientTransport({command:process.execPath,args:['dist/index.js']}));
const common={attacker:151,defender:151,moveType:'fire',power:90,category:'special'};
async function call(args,error=false){const r=await client.callTool({name:'calc_damage',arguments:args});assert.equal(!!r.isError,error,JSON.stringify(r));return error?r.content[0].text:JSON.parse(r.content[0].text);}
// Psychic vectors use a Normal Tera defender to isolate STAB from Mew's Psychic resistance.
async function vector(label,args,min,max,fields={}){const r=await call({...common,...(args.moveType==='psychic'?{defenderTeraType:'normal'}:{}),...args});assert.deepEqual([r.damage.min,r.damage.max],[min,max],label);for(const [k,v]of Object.entries(fields))assert.deepEqual(r.computed[k],v,label+': '+k);assert.equal(r.damage.rolls.length,16);assert.match(r.limitations,/现已计入项/);console.log(`${label}: ${min}–${max}`);return r;}
try{
// Independent hand arithmetic: Mew's 100 base stats give floor(231/2)+5=120.
// L50 coefficient=22, P90, A=D=120 => floor(1980/50)+2=41.
// R(x)=nearest, ties down. Random step floors before STAB.
const sun=await vector('sun: R(41×1.5)=61; floor(61×.85)=51',{weather:'sun'},51,61);
assert.deepEqual(sun.damage.rolls,[51,52,53,53,54,54,55,56,56,57,57,58,59,59,60,61]);
await vector('rain water: same weather boost',{weather:'rain',moveType:'water'},51,61);
await vector('rain fire: R(41/2)=20; floor(20×.85)=17',{weather:'rain'},17,20);
// Terrain BP=R(90×5325/4096)=117; base=53; random=45..53; psychic STAB R(×1.5).
await vector('psychic terrain: BP117, base53, STAB1.5',{terrain:'psychic',moveType:'psychic'},67,79,{power:117});
await vector('electric terrain: BP117, base53, no STAB',{terrain:'electric',moveType:'electric'},45,53);
await vector('grassy terrain: BP117, base53, no STAB',{terrain:'grassy',moveType:'grass'},45,53);
await vector('misty dragon: BP45, base21, random17..21',{terrain:'misty',moveType:'dragon'},17,21);
await vector('choice specs: A180, base61',{item:'choice-specs'},51,61,{attack:180});
await vector('choice band: A180, base61',{item:'choice-band',category:'physical'},51,61,{attack:180});
await vector('life orb: R(34×5324/4096)=44, R(41×5324/4096)=53',{item:'life-orb'},44,53);
await vector('charcoal: BP108, base49, random41..49',{item:'charcoal'},41,49,{power:108});
await vector('adaptability: random34..41 ×2',{attackerAbility:'adaptability',moveType:'psychic'},68,82,{stab:2});
await vector('huge power: A240, base81, random68..81',{attackerAbility:'huge-power',category:'physical'},68,81,{attack:240});
await vector('pure power: same doubled attack',{attackerAbility:'pure-power',category:'physical'},68,81,{attack:240});
await vector('solar power sun: A180 base61; weather91; random77..91',{attackerAbility:'solar-power',weather:'sun'},77,91,{attack:180});
await vector('tera fire new STAB: R(34×1.5)..R(41×1.5)',{teraType:'fire'},51,61,{stab:1.5});
await vector('tera psychic original STAB ×2',{teraType:'psychic',moveType:'psychic'},68,82,{stab:2});
await vector('tera keeps original psychic STAB',{teraType:'fire',moveType:'psychic'},51,61,{stab:1.5});
await vector('adaptability tera psychic ×2.25',{teraType:'psychic',moveType:'psychic',attackerAbility:'adaptability'},76,92,{stab:2.25});
await vector('adaptability only boosts tera type',{teraType:'fire',moveType:'psychic',attackerAbility:'adaptability'},51,61,{stab:1.5});
await vector('defender tera grass: fire ×2',{defenderTeraType:'grass'},68,82,{effectiveness:2});
await vector('expert belt: grass tera ×2 then 4915/4096',{defenderTeraType:'grass',item:'expert-belt'},82,98);
await vector('technician BP60→90',{power:60,attackerAbility:'technician'},34,41,{power:90});
await vector('critical sniper: base floor(41×1.5)=61, then sniper ×1.5',{critical:true,attackerAbility:'sniper'},76,91);
await vector('sand rock special defense120→180: base28',{weather:'sand',defenderTeraType:'rock',moveType:'dragon'},23,28,{defense:180});
await vector('snow ice physical defense120→180: base28',{weather:'snow',defenderTeraType:'ice',moveType:'normal',category:'physical'},23,28,{defense:180});
await vector('hail no direct multiplier',{weather:'hail'},34,41);
await vector('grassy earthquake: BP45, base21',{terrain:'grassy',moveName:'earthquake',moveType:'ground'},17,21);
await vector('grassy other ground unchanged',{terrain:'grassy',moveType:'ground'},34,41);
await vector('airborne attacker no terrain boost',{terrain:'electric',moveType:'electric',attackerGrounded:false},34,41);
await vector('misty airborne defender no reduction',{terrain:'misty',moveType:'dragon',defenderGrounded:false},34,41);
await vector('psychic priority block',{terrain:'psychic',priority:1},0,0);
await vector('levitate immunity',{defenderAbility:'levitate',moveType:'ground'},0,0);
await vector('flying immunity survives terrain',{terrain:'electric',defenderTeraType:'flying',moveType:'ground'},0,0);
await vector('ground type electric immunity survives terrain',{terrain:'electric',defenderTeraType:'ground',moveType:'electric'},0,0);
await vector('cloud nine suppresses sun',{weather:'sun',defenderAbility:'cloud-nine'},34,41,{weather:'none'});
await vector('dry skin water immunity',{defenderAbility:'dry-skin',weather:'rain',moveType:'water'},0,0);
const stat={iv:31,ev:0,nature:'neutral',stage:2};
await vector('defender unaware ignores attack stage',{defenderAbility:'unaware',attack:stat},34,41,{attack:120});
await vector('attacker unaware ignores defense stage',{attackerAbility:'unaware',defense:stat},34,41,{defense:120});
const auto=await call({...common,attacker:308,useAbilities:true,category:'physical'});assert.equal(auto.computed.attackerAbility,'pure-power');assert.equal(auto.computed.attack,160);
const override=await call({...common,attacker:308,useAbilities:true,attackerAbility:'none',category:'physical'});assert.equal(override.computed.attack,80);
const unsupported=await call({...common,attackerAbility:'unknown-ability'});assert(unsupported.warnings.some(x=>x.includes('unknown-ability')));
assert.match(await call({...common,item:'leftovers'},true),/Unsupported item.*leftovers/);
for(const item of (await call({...common,item:'none'})).supportedItems)await call({...common,item});
// Frozen 0.2.0 full roll fixtures remain regression checks without an old checkout.
for(const [args,expected] of [
 [{...common},[34,35,35,36,36,36,37,37,38,38,38,39,39,40,40,41]],
 [{...common,defender:3},[69,70,71,72,72,73,74,75,76,77,77,78,79,80,81,82]],
 [{...common,attacker:6,defender:3},[112,113,114,116,117,118,120,121,122,124,125,126,128,129,130,132]],
 [{...common,attacker:25,defender:50,moveType:'electric'},Array(16).fill(0)]
])assert.deepEqual((await call(args)).damage.rolls,expected);
// Compare actual pre-change 0.2.0 server, including every roll, HP percentages and OHKO.
if(process.argv[2]){
 const old=new Client({name:'legacy-regression',version:'1'});await old.connect(new StdioClientTransport({command:process.execPath,args:[process.argv[2]]}));
 try{for(const args of [common,{...common,defender:3},{...common,attacker:6,defender:3},{...common,attacker:25,defender:50,moveType:'electric'},{...common,attacker:151,defender:151,moveType:'psychic',attack:stat}]){
  const r=await old.callTool({name:'calc_damage',arguments:args});assert(!r.isError);const baseline=JSON.parse(r.content[0].text),current=await call(args);
  for(const k of ['assumptions','computed','damage','ohko'])assert.deepEqual(current[k],baseline[k],k);
  console.log(`0.2.0 regression ${args.attacker}→${args.defender} ${args.moveType}: ${current.damage.min}–${current.damage.max}, all fields equal`);
 }}finally{await old.close();}
}
console.log('PASS: hand vectors, edge cases, auto/override abilities, support table and MCP errors.');
}finally{await client.close();}
