// Curated seed list of common English words suitable for brandable names.
// Expand by loading additional words from KV (key: "wordlist") in production.
export const BRANDABLE_WORDS = [
  'anchor','arc','arch','atom','aurora','axis',
  'bay','beam','blade','bloom','bolt','bond','boost','branch','bridge','bright',
  'cache','calm','canvas','carbon','cascade','cave','cedar','chalk','chart','chase',
  'chrome','cinder','circuit','citrus','clay','cliff','cloud','cluster','comet','core',
  'craft','crest','crystal','curve',
  'dawn','delta','depth','dew','disk','dome','drift','dune','dust',
  'echo','edge','ember','epoch','ether',
  'fable','facet','falcon','fern','fiber','field','flare','flash','fleet','flint',
  'flow','flux','foam','fold','forge','form','frost','fuse',
  'gale','gate','gem','ghost','glade','glare','glide','glow','graft','grain','graph',
  'grove','gulf',
  'haven','haze','helix','helm','hive','hollow','horizon','hue',
  'index','ink','ion','iris',
  'jade','jet',
  'keen','kernel','keystone',
  'lance','lark','laser','lattice','lava','layer','leaf','ledge','lens','level',
  'lime','link','lint','loop','lumen','luna',
  'marble','marsh','mast','meadow','mesh','meta','mint','mirror','mist','mode',
  'momentum','moon','moss','motion','mount',
  'nebula','neon','nest','node','north','nova','null',
  'oak','ocean','orbit','ore',
  'pace','path','peak','pearl','pebble','phase','pine','pivot','pixel','plain',
  'plane','plasma','plateau','pocket','polaris','port','prism','pulse',
  'quartz','queue',
  'radar','reef','relay','ridge','ripple','river','rocket','root','ruby','rune',
  'sail','salt','sand','scale','scope','seam','seed','shade','shaft','shard',
  'shell','shift','shore','signal','silica','silver','slate','slope','solar',
  'source','sphere','spin','spiral','spring','spur','stack','star','stark','stem',
  'stone','storm','strand','stream','summit','surge','swift',
  'teal','terra','thatch','tide','tilt','timber','titan','torch','trace','trail',
  'trek','trident','trunk','tunnel','turbo',
  'ultra','umbra','unity',
  'vale','vapor','vault','vector','veil','vent','vibe','void','volt','vortex',
  'wave','web','wellspring','wind','wire','wren',
  'xenon',
  'yard','yew',
  'zenith','zephyr','zinc','zone',
];

export function getSlice(start, count) {
  return BRANDABLE_WORDS.slice(start, start + count);
}

export function totalWords() {
  return BRANDABLE_WORDS.length;
}
