"""Build compact offline evidence; cached raw responses stay outside npm package.
Requires Python requests. Run: python3 scripts/snapshot-pokeapi.py [cache-directory]
Three workers, >=200ms pause per request, five retries, output only on success.
"""
import concurrent.futures as cf
import hashlib, json, pathlib, sys, time, threading
import requests
CACHE=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/random-pokemon-pokeapi-cache')
CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://pokeapi.co/api/v2/'
local=threading.local()
def fetch(key):
    path=CACHE/(key.replace('/','-')+'.json')
    if path.exists(): return json.loads(path.read_text())
    for attempt in range(5):
        try:
            time.sleep(.2)
            if not hasattr(local,'session'): local.session=requests.Session()
            r=local.session.get(BASE+key,headers={'User-Agent':'random-pokemon-mcp/0.2.0 offline-snapshot'},timeout=60)
            r.raise_for_status()
            raw=r.content
            data=json.loads(raw)
            path.write_bytes(raw)
            return data
        except Exception:
            if attempt==4: raise
            time.sleep(2**attempt)
def batch(keys):
    with cf.ThreadPoolExecutor(max_workers=3) as ex:
        results=[]
        for i,value in enumerate(ex.map(fetch,keys)):
            results.append(value)
            if (i+1)%100==0: print(f'{i+1}/{len(keys)} fetched/cached',flush=True)
        return results
pokemon=batch([f'pokemon/{i}' for i in range(1,1026)])
species=batch([f'pokemon-species/{i}' for i in range(1,1026)])
keys=sorted({m['move']['url'].removeprefix(BASE).rstrip('/') for p in pokemon for m in p['moves']})
moves=batch(keys)
metadata={m['name']:m for m in moves}
records=[]
for p,s in zip(pokemon,species):
    assert p['id']==s['id'] and p['abilities']
    types=sorted({metadata[m['move']['name']]['type']['name'] for m in p['moves'] if metadata[m['move']['name']]['damage_class']['name']!='status'})
    assert set(types)<=set('normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split())
    records.append({'id':p['id'],'abilities':[{'name':a['ability']['name'],'is_hidden':a['is_hidden'],'slot':a['slot']} for a in p['abilities']], 'is_legendary':s['is_legendary'],'is_mythical':s['is_mythical'],'learnableAttackTypes':types})
hashes={key:hashlib.sha256((CACHE/(key.replace('/','-')+'.json')).read_bytes()).hexdigest() for key in [*[f'pokemon/{i}' for i in range(1,1026)],*[f'pokemon-species/{i}' for i in range(1,1026)],*keys]}
output={'source':BASE,'fetchedAt':time.strftime('%Y-%m-%d',time.gmtime()),'speciesCount':len(records),'moveCount':len(moves),'scope':'Default pokemon IDs 1-1025; union of all version-group learnsets; non-status moves only; no current-format legality or submitted-move validation. Move type as reported by current PokeAPI, without dynamic type mechanics.','records':records}
pathlib.Path('data/pokeapi.json').write_text(json.dumps(output,separators=(',',':'))+'\n')
pathlib.Path('data/pokeapi-sha256.json').write_text(json.dumps(hashes,separators=(',',':'))+'\n')
print(f'Complete: {len(records)} species, {len(moves)} move metadata responses',flush=True)
