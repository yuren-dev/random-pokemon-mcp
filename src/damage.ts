import { dualEffectiveness, type ChartType } from './type-chart.js';
export type Combatant = {id:number;name:string;types:ChartType[];stats:Record<string,number>;abilities:{name:string;is_hidden:boolean;slot:number}[]};
export const DAMAGE_LIMITS='仍未计入项：烧伤、反射壁/光墙/极光幕、双打/多目标、特殊招式机制（太晶威力下限/太晶爆发/多段/固定伤害等）、星晶、未列出的特性/道具、场外持续伤害与回血、极端数值溢出；不是完整对战模拟。';
export const TYPE_ITEMS:Record<string,ChartType>={
 'silk-scarf':'normal','charcoal':'fire','mystic-water':'water','magnet':'electric','miracle-seed':'grass','never-melt-ice':'ice','black-belt':'fighting','poison-barb':'poison','soft-sand':'ground','sharp-beak':'flying','twisted-spoon':'psychic','silver-powder':'bug','hard-stone':'rock','spell-tag':'ghost','dragon-fang':'dragon','black-glasses':'dark','metal-coat':'steel','fairy-feather':'fairy',
};
export const SUPPORTED_ITEMS=['none','choice-band','choice-specs','life-orb','expert-belt',...Object.keys(TYPE_ITEMS)];
export const SUPPORTED_ABILITIES=['none','huge-power','pure-power','unaware','adaptability','technician','sniper','solar-power','chlorophyll','swift-swim','rain-dish','dry-skin','sand-force','sand-rush','sand-veil','snow-cloak','slush-rush','ice-body','drought','drizzle','sand-stream','snow-warning','air-lock','cloud-nine','levitate','water-absorb','storm-drain','flash-fire','lightning-rod','volt-absorb','motor-drive','sap-sipper'];
const id=(s:string)=>s.toLowerCase().trim().replace(/[ _]+/g,'-');
// Cartridge rounding: nearest integer, ties down; modifiers use 12-bit fixed point.
const round=(n:number)=>Math.ceil(n-0.5);
const chain=(mods:number[])=>mods.reduce((m,n)=>Math.floor((m*n+2048)/4096),4096);
const apply=(n:number,mods:number[])=>Math.max(1,round(n*chain(mods)/4096));
function stat(base:number,s:any,level:number,ignore=false){const raw=Math.floor((Math.floor((2*base+s.iv+Math.floor(s.ev/4))*level/100)+5)*(s.nature==='boosted'?1.1:s.nature==='hindered'?0.9:1));const stage=ignore?0:s.stage;return Math.max(1,Math.floor(raw*(stage>=0?(2+stage)/2:2/(2-stage))));}
export function calculateDamage(a:any,atk:Combatant,def:Combatant){
 const extra=['weather','terrain','item','useAbilities','attackerAbility','defenderAbility','teraType','defenderTeraType','attackerGrounded','defenderGrounded','moveName','priority','critical'];
 const modern=extra.some(k=>a[k]!==undefined);
 const warnings:string[]=[];
 function ability(p:Combatant,override?:string){
  if(!modern||(!a.useAbilities&&override===undefined))return 'none';
  const selected=override===undefined||override==='auto'?p.abilities.filter(x=>!x.is_hidden).sort((x,y)=>x.slot-y.slot)[0]?.name:override;
  const name=id(selected??'none');
  if(!SUPPORTED_ABILITIES.includes(name))warnings.push(`未支持特性 ${name}（${p.name}），未计入其效果；请显式选择支持的特性或 none。`);
  return name;
 }
 const aa=ability(atk,a.attackerAbility),da=ability(def,a.defenderAbility);
 const item=id(a.item??'none');
 if(!SUPPORTED_ITEMS.includes(item))throw Error(`Unsupported item / 不支持的道具: ${a.item}. Supported: ${SUPPORTED_ITEMS.join(', ')}`);
 let weather=a.weather??'none';
 // Weather setters do not infer switch-in order; callers supply the current weather.
 if([aa,da].some(x=>['air-lock','cloud-nine'].includes(x)))weather='none';
 const terrain=a.terrain??'none',physical=a.category==='physical';
 const at=atk.types,dt:ChartType[]=a.defenderTeraType?[a.defenderTeraType]:def.types;
 const attackTypes:ChartType[]=a.teraType?[a.teraType]:at;
 const ag=a.attackerGrounded??(!attackTypes.includes('flying')&&aa!=='levitate');
 const dg=a.defenderGrounded??(!dt.includes('flying')&&da!=='levitate');
 const critical=a.critical??false;
 let attack=stat(atk.stats[physical?'attack':'special-attack'],a.attack,a.level,da==='unaware'||(critical&&a.attack.stage<0));
 let defense=stat(def.stats[physical?'defense':'special-defense'],a.defense,a.level,aa==='unaware'||(critical&&a.defense.stage>0));
 const am:number[]=[];
 if(physical&&['huge-power','pure-power'].includes(aa))am.push(8192);
 if(!physical&&aa==='solar-power'&&weather==='sun')am.push(6144);
 if((physical&&item==='choice-band')||(!physical&&item==='choice-specs'))am.push(6144);
 attack=apply(attack,am);
 if((weather==='sand'&&dt.includes('rock')&&!physical)||(weather==='snow'&&dt.includes('ice')&&physical))defense=round(defense*1.5);
 const bpMods:number[]=[];
 const terrainType:Record<string,string>={electric:'electric',grassy:'grass',psychic:'psychic'};
 if(ag&&terrainType[terrain]===a.moveType)bpMods.push(5325);
 if(dg&&((terrain==='misty'&&a.moveType==='dragon')||(terrain==='grassy'&&['earthquake','bulldoze','magnitude'].includes(a.moveName))))bpMods.push(2048);
 if(aa==='technician'&&a.power<=60)bpMods.push(6144);
 if(aa==='sand-force'&&weather==='sand'&&['ground','rock','steel'].includes(a.moveType))bpMods.push(5325);
 if(da==='dry-skin'&&a.moveType==='fire')bpMods.push(5120);
 if(TYPE_ITEMS[item]===a.moveType)bpMods.push(4915);
 const power=modern?apply(a.power,bpMods):a.power;
 let effectiveness=dualEffectiveness(a.moveType,dt as [ChartType,ChartType]);
 let blocked:string|undefined;
 if(da==='levitate'&&a.moveType==='ground')blocked='levitate';
 const immunities:Record<string,string[]>={water:['water-absorb','storm-drain','dry-skin'],fire:['flash-fire'],electric:['lightning-rod','volt-absorb','motor-drive'],grass:['sap-sipper']};
 if(immunities[a.moveType]?.includes(da))blocked=da;
 if(terrain==='psychic'&&dg&&(a.priority??0)>0)blocked='psychic-terrain priority protection';
 if(blocked)effectiveness=0;
 let stab=at.includes(a.moveType)?1.5:1;
 if(a.teraType===a.moveType)stab=at.includes(a.moveType)?2:1.5;
 if(aa==='adaptability'&&(!a.teraType||a.teraType===a.moveType)&&stab>1)stab=stab===2?2.25:2;
 const hp=def.id===292?1:Math.floor((2*def.stats.hp+a.hpIV+Math.floor(a.hpEV/4))*a.level/100)+a.level+10;
 const target=a.currentHP??hp;if(target>hp)throw Error(`currentHP exceeds calculated max HP ${hp}.`);
 let base=Math.floor(Math.floor((Math.floor(2*a.level/5)+2)*power*attack/defense)/50)+2;
 let weatherModifier=1;
 if((weather==='sun'&&a.moveType==='fire')||(weather==='rain'&&a.moveType==='water'))weatherModifier=1.5;
 if((weather==='sun'&&a.moveType==='water')||(weather==='rain'&&a.moveType==='fire'))weatherModifier=0.5;
 if(modern){base=round(base*weatherModifier);if(critical)base=Math.floor(base*1.5);}
 const finalMods:number[]=[];
 if(critical&&aa==='sniper')finalMods.push(6144);
 if(item==='expert-belt'&&effectiveness>1)finalMods.push(4915);
 if(item==='life-orb')finalMods.push(5324);
 const rolls=Array.from({length:16},(_,i)=>{
  if(effectiveness===0)return 0;
  if(!modern)return Math.max(1,Math.floor(base*(85+i)/100*stab*effectiveness));
  const random=Math.floor(base*(85+i)/100);
  const typed=Math.floor(round(random*stab)*effectiveness);
  return apply(typed,finalMods);
 });
 const limitations=modern?`现已计入项：Gen IX 常规单次伤害、天气/场地、支持表内道具/已选择特性、18属性太晶 STAB 与防御属性、显式会心一击、85–100随机数、逐步定点舍入。${DAMAGE_LIMITS}`:`兼容 0.2.0 公式；现已计入项：能力值/等级/本系/属性克制/85–100随机数。未计入项：天气/场地/道具/特性/太晶、暴击、烧伤、墙、双打修正、特殊招式机制及逐步定点舍入；不是完整对战模拟。`;
 if(modern)warnings.push('沙暴无直接招式倍率，但岩石系特防×1.5；雪景冰系防御×1.5；冰雹无直接伤害倍率。天气持续伤害不计。场地不提供地面系免疫；飞行属性/漂浮另行判定。', '天气/场地按输入的当前状态；不推断入场顺序。叶绿素/悠游自如等速度效果、雨盘/冰冻之躯等回血不改变本次伤害；引火吸收后的攻击增益不计。');
 return {attacker:atk.name,defender:def.name,assumptions:a,computed:{attack,defense,maxHP:hp,currentHP:target,stab,effectiveness,...(modern?{mode:'gen9',power,weather,weatherModifier,terrain,attackerAbility:aa,defenderAbility:da,item,attackerGrounded:ag,defenderGrounded:dg,defenderTypes:dt,baseDamage:base,blocked}: {})},damage:{min:rolls[0],max:rolls[15],rolls,percentOfMaxHP:[rolls[0]/hp*100,rolls[15]/hp*100]},ohko:{possible:rolls[15]>=target,guaranteed:rolls[0]>=target,rollsKO:rolls.filter(d=>d>=target).length,totalRolls:16,maximumCurrentHPForPossibleOHKO:rolls[15],maximumCurrentHPForGuaranteedOHKO:rolls[0]},limitations,...(modern?{warnings,supportedItems:SUPPORTED_ITEMS,supportedAbilities:SUPPORTED_ABILITIES}:{})};
}
