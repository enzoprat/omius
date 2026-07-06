/* =====================================================================
   OMIUS VODKA — flavor worlds, motion & interactions
   ===================================================================== */
(() => {
'use strict';

const BUY = 'https://espaceclient.lacaveatitoune.fr/article/';
const FLAVORS = {
  puregrain: {
    name:'Pure Grain', deg:'40°', bottle:'assets/bottle-puregrain.png',
    tagline:'Pure Grain.\nFull Flavor.',
    marquee:'Pure Grain • Full Flavor •\u00a0',
    desc:"La distillation à l'état pur. Nette, cristalline, taillée pour la glace et les nuits limpides.",
    notes:['Cristallin','Minéral','Frais','Net'],
    fruits:['fr-ice','fr-drop','fr-ice'], photo:false,
    buy: BUY+'5406-vodka-omius-pure-grain-40-70cl',
  },
  mangue: {
    name:'Mangue', deg:'37,5°', bottle:'assets/bottle-mangue.png',
    tagline:'Le soleil\nen bouteille.',
    marquee:'Mangue • Soleil tropical •\u00a0',
    desc:"Une mangue mûre à cœur, tropicale et solaire. La chaleur douce d'un après-midi qui ne finit pas.",
    notes:['Tropical','Solaire','Juteux','Doux'],
    fruits:['fr-mango','fr-leaf','fr-mango'], photo:'assets/fruit-mango.png',
    buy: BUY+'5408-vodka-omius-mangue-pure-grain-375-70cl',
  },
  peche: {
    name:'Pêche', deg:'37,5°', bottle:'assets/bottle-peche.png',
    tagline:'La douceur\nqui a du caractère.',
    marquee:'Pêche de vigne • Velours •\u00a0',
    desc:"Pêche de vigne, veloutée et généreuse. Sucrée juste ce qu'il faut, jamais mièvre.",
    notes:['Velouté','Juteux','Tendre','Estival'],
    fruits:['fr-peach','fr-leaf','fr-peach'], photo:false,
    buy: BUY+'5407-vodka-omius-peche-pure-grain-375-70cl',
  },
  redberry: {
    name:'Red Berry', deg:'37,5°', bottle:'assets/bottle-redberry.png',
    tagline:'Les nuits\nqui ont du goût.',
    marquee:'Red Berry • Fruits rouges •\u00a0',
    desc:"Fraise, framboise, fruits rouges à pleine maturité. Gourmand, profond, un brin insolent.",
    notes:['Gourmand','Framboise','Fraise','Intense'],
    fruits:['fr-berry','fr-rasp','fr-berry'], photo:false,
    buy: BUY+'5409-vodka-omius-red-berry-pure-grain-375-70cl',
  },
};
const ORDER = ['puregrain','mangue','peche','redberry'];

const COCKTAILS = [
  {n:'01', t:'Sur glace',    d:'Deux glaçons, un zeste. Laissez la fraîcheur faire le reste.', f:'fr-ice'},
  {n:'02', t:'Omius Spritz', d:'OMIUS, eau pétillante, une touche de fruit frais bien froid.', f:'fr-drop'},
  {n:'03', t:'Le Frappé',    d:'Shakée minute avec de la glace pilée, servie givrée.',        f:'fr-peach'},
  {n:'04', t:'Signature',    d:'Une base Pure Grain, un trait de sirop, beaucoup d’allure.',   f:'fr-berry'},
];

// Fixed placement template for hero fruits (avoids centre reading zone).
// x,y in %, s = size(px at 1440w), d = parallax depth, layer, blur:0/1/2
const HERO_SLOTS = [
  {x:8,  y:24, s:120, d:.10, layer:'back',  blur:2, rot:-12},
  {x:86, y:18, s:150, d:.18, layer:'back',  blur:1, rot:14},
  {x:16, y:70, s:170, d:.26, layer:'front', blur:0, rot:8},
  {x:88, y:66, s:190, d:.30, layer:'front', blur:0, rot:-10},
  {x:4,  y:50, s:90,  d:.14, layer:'back',  blur:1, rot:20},
  {x:93, y:44, s:80,  d:.12, layer:'back',  blur:2, rot:-8},
  {x:24, y:12, s:70,  d:.20, layer:'front', blur:0, rot:16},
  {x:74, y:84, s:110, d:.34, layer:'front', blur:0, rot:-14},
];
const UNI_SLOTS = [
  {x:2,  y:20, s:90,  blur:1, rot:-10},
  {x:80, y:8,  s:120, blur:0, rot:12},
  {x:88, y:74, s:140, blur:0, rot:-8},
  {x:6,  y:78, s:70,  blur:1, rot:18},
];

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const svgUse = id => `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet"><use href="#${id}"/></svg>`;

let current = document.documentElement.getAttribute('data-flavor') || 'mangue';

/* ---------------- FRUIT BUILDERS ---------------- */
function makeFruit(sym, photo, slot, scale=1){
  const el = document.createElement('div');
  el.className = 'fruit' + (slot.blur===1?' blur':slot.blur===2?' blur2':'');
  const vwScale = Math.max(0.4, Math.min(1.1, window.innerWidth/1440));
  const size = slot.s*scale*vwScale;
  el.style.left = slot.x+'%';
  el.style.top  = slot.y+'%';
  el.style.width = size+'px';
  el.style.height = size+'px';
  el.style.setProperty('--r', (slot.rot||0)+'deg');
  el.dataset.depth = slot.d || .2;
  const dur = (6 + Math.random()*5).toFixed(2);
  const delay = (-Math.random()*6).toFixed(2);
  el.style.animation = `floatY ${dur}s ${delay}s var(--ease,ease-in-out) infinite alternate`;
  if (photo){
    el.innerHTML = `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:50%">`;
  } else {
    el.innerHTML = svgUse(sym) + '<span class="gloss"></span>';
  }
  return el;
}

function renderHeroFruits(f){
  const back = $('#fruitsBack'), front = $('#fruitsFront');
  back.innerHTML=''; front.innerHTML='';
  HERO_SLOTS.forEach((slot,i)=>{
    const sym = f.fruits[i % f.fruits.length];
    // use photo for a couple of front slots when available
    const usePhoto = f.photo && (i===2 || i===3);
    const el = makeFruit(sym, usePhoto?f.photo:false, slot);
    (slot.layer==='back'?back:front).appendChild(el);
  });
}
function renderUniFruits(f){
  const wrap = $('#uniFruits'); wrap.innerHTML='';
  UNI_SLOTS.forEach((slot,i)=>{
    const sym = f.fruits[i % f.fruits.length];
    const usePhoto = f.photo && i===1;
    wrap.appendChild(makeFruit(sym, usePhoto?f.photo:false, {...slot,d:.15}, .85));
  });
}

/* ---------------- FLAVOR SWITCH ---------------- */
function setFlavor(key, instant=false){
  const f = FLAVORS[key]; if(!f) return;
  current = key;
  document.documentElement.setAttribute('data-flavor', key);

  // selector + gamme active states
  $$('.sel').forEach(b=>b.classList.toggle('active', b.dataset.flavor===key));
  $$('.card').forEach(c=>c.classList.toggle('is-active', c.dataset.flavor===key));

  // hero title
  const title = $('#heroTitle');
  const html = f.tagline.replace(/\n/g,'<br>');
  const marq = $('.marquee-track');

  // univers panel content
  const setUni = ()=>{
    $('#uniName').textContent = f.name;
    $('#uniDeg').textContent = f.deg + ' • Vodka';
    $('#uniDesc').textContent = f.desc;
    $('#uniNotes').innerHTML = f.notes.map(n=>`<li>${n}</li>`).join('');
    $('#uniBuy').setAttribute('href', f.buy);
    const ub = $('#uniBottle'); ub.src = f.bottle; ub.alt = 'OMIUS '+f.name;
    renderUniFruits(f);
  };

  if (instant || !window.gsap){
    title.innerHTML = html;
    $('#heroBottle').src = f.bottle;
    if(marq) marq.querySelectorAll('span').forEach(s=>s.textContent=f.marquee);
    setUni(); renderHeroFruits(f); return;
  }

  const g = window.gsap;
  // title swap
  g.to(title,{duration:.28,y:-16,opacity:0,ease:'power2.in',onComplete:()=>{
    title.innerHTML=html; g.fromTo(title,{y:18,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out'});
  }});
  // bottle crossfade + pop
  const hb = $('#heroBottle');
  g.to(hb,{duration:.3,opacity:0,scale:.94,filter:'blur(6px)',ease:'power2.in',onComplete:()=>{
    hb.src=f.bottle;
    g.fromTo(hb,{opacity:0,scale:.94,filter:'blur(6px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:.6,ease:'power3.out'});
  }});
  // marquee
  if(marq) marq.querySelectorAll('span').forEach(s=>s.textContent=f.marquee);
  // fruits burst
  renderHeroFruits(f);
  g.fromTo('#fruitsBack .fruit, #fruitsFront .fruit',
    {opacity:0,scale:.6},{opacity:1,scale:1,duration:.7,stagger:.04,ease:'back.out(1.6)'});
  setUni();
}

/* ---------------- BUILD STATIC CONTENT ---------------- */
function buildCocktails(){
  $('#cocktailRow').innerHTML = COCKTAILS.map(c=>`
    <article class="cocktail">
      <div class="ck-fruit">${svgUse(c.f)}</div>
      <span class="ck-num">${c.n}</span>
      <h4>${c.t}</h4>
      <p>${c.d}</p>
    </article>`).join('');
}
function buildGamme(){
  $('#gammeGrid').innerHTML = ORDER.map(k=>{
    const f=FLAVORS[k];
    const bite = (f.photo&&k==='mangue') ? `<img src="${f.photo}" class="card-bite" alt="">` : '';
    return `
    <article class="card" data-flavor="${k}">
      <div class="card-bg" data-cardbg="${k}"></div>
      <div class="card-inner">
        <div class="card-bottle-wrap">
          <img src="${f.bottle}" class="card-bottle" alt="OMIUS ${f.name}">
          ${bite}
        </div>
        <h3 class="card-name">${f.name}</h3>
        <span class="card-deg">${f.deg} · 70cl</span>
        <a href="${f.buy}" target="_blank" rel="noopener" class="card-buy">Acheter</a>
      </div>
    </article>`;
  }).join('');

  // per-card gradient background using that flavor's tokens
  const grads = {
    puregrain:'linear-gradient(180deg,#eaf9ff,#a9def8 55%,#5fbdef)',
    mangue:'linear-gradient(180deg,#fff2bf,#ffd457 55%,#ff9e1f)',
    peche:'linear-gradient(180deg,#ffe7d8,#ffb68d 55%,#ff7e52)',
    redberry:'linear-gradient(180deg,#ffd6df,#ff6f8f 55%,#dc1f45)',
  };
  $$('.card-bg').forEach(b=> b.style.background = grads[b.dataset.cardbg]);
  $$('.card-bite').forEach(b=> b.style.display='block');

  $$('.card').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('.card-buy')) return; // let buy link work
      setFlavor(card.dataset.flavor);
      scrollTo('#saveurs');
    });
  });
}

/* ---------------- SMOOTH SCROLL + GSAP ---------------- */
let lenis;
function scrollTo(sel){
  const el = $(sel); if(!el) return;
  if(lenis) lenis.scrollTo(el,{offset:-60,duration:1.2});
  else el.scrollIntoView({behavior:'smooth'});
}

function initMotion(){
  const g = window.gsap; const ST = window.ScrollTrigger;
  if(g && ST) g.registerPlugin(ST);

  // Lenis
  if(window.Lenis){
    lenis = new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
    lenis.on('scroll', ()=>ST && ST.update());
    g && g.ticker.add(t=>lenis.raf(t*1000));
    g && g.ticker.lagSmoothing(0);
  }

  // nav links smooth scroll
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href');
      if(id.length>1 && $(id)){e.preventDefault(); scrollTo(id);}
    });
  });

  // nav scrolled state
  const nav=$('#nav');
  const onScroll=()=>nav.classList.toggle('scrolled', window.scrollY>40);
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  if(!g || !ST) return;

  // hero intro
  g.timeline({delay:.15})
    .from('.hero-supra',{y:24,opacity:0,duration:.7,ease:'power3.out'})
    .from('#heroTitle',{y:40,opacity:0,duration:.9,ease:'power3.out'},'-=.4')
    .from('.stage-bottle',{y:60,opacity:0,scale:.9,duration:1.1,ease:'power3.out'},'-=.7')
    .from('.hero-sub',{y:20,opacity:0,duration:.7},'-=.6')
    .from('.hero-cta',{y:20,opacity:0,duration:.6},'-=.5')
    .from('.selector',{y:30,opacity:0,duration:.7,ease:'back.out(1.4)'},'-=.4')
    .from('.fruits .fruit',{opacity:0,scale:.5,duration:.7,stagger:.05,ease:'back.out(1.6)'},'-=.9');

  // hero parallax (bottle rises / fades on scroll)
  g.to('.hero-stage',{yPercent:-14,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  g.to('.hero-type',{yPercent:-40,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'70% top',scrub:true}});

  // reveals
  $$('.reveal').forEach(el=>{
    g.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });
  // section headers + panels
  $$('.uni-head, .uni-info, .uni-visual, .sig-text, .sig-card, .cocktail, .card, .stockist, .trouver-text, .mani-title')
    .forEach((el,i)=>{
      g.from(el,{y:44,opacity:0,duration:.9,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 86%'}});
    });

  // univers bottle parallax
  g.to('#uniBottle',{yPercent:-8,ease:'none',scrollTrigger:{trigger:'#saveurs',start:'top bottom',end:'bottom top',scrub:true}});
  g.to('.sig-card img',{yPercent:-10,ease:'none',scrollTrigger:{trigger:'.signature',start:'top bottom',end:'bottom top',scrub:true}});

  // pointer + scroll parallax on fruits
  const fruits=()=>$$('.fruits .fruit');
  window.addEventListener('pointermove',e=>{
    const dx=(e.clientX/window.innerWidth-.5), dy=(e.clientY/window.innerHeight-.5);
    fruits().forEach(fr=>{const d=+fr.dataset.depth||.2;
      fr.style.setProperty('--px', (dx*d*60).toFixed(1)+'px');
      fr.style.setProperty('--py', (dy*d*60).toFixed(1)+'px');
    });
  },{passive:true});
  // apply pointer offset via wrapper transform trick
  g.ticker.add(()=>{
    fruits().forEach(fr=>{
      const px=fr.style.getPropertyValue('--px')||'0px';
      const py=fr.style.getPropertyValue('--py')||'0px';
      fr.style.marginLeft=px; fr.style.marginTop=py;
    });
  });
}

/* ---------------- PRELOADER ---------------- */
function initPreloader(){
  const pre=$('#preloader'); const bar=$('.pre-bar span');
  let p=0;
  const iv=setInterval(()=>{ p=Math.min(100,p+Math.random()*22); bar.style.width=p+'%';
    if(p>=100){clearInterval(iv); setTimeout(done,350);}
  },140);
  function done(){ pre.classList.add('done'); document.body.style.overflow=''; }
  document.body.style.overflow='hidden';
}

/* ---------------- INIT ---------------- */
function init(){
  $('#yr').textContent=new Date().getFullYear();
  buildCocktails();
  buildGamme();
  setFlavor(current, true);

  // selector clicks
  $$('.sel').forEach(b=> b.addEventListener('click',()=>setFlavor(b.dataset.flavor)));
  // keyboard arrows to cycle
  window.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      const i=ORDER.indexOf(current);
      const n=(i+(e.key==='ArrowRight'?1:ORDER.length-1))%ORDER.length;
      setFlavor(ORDER[n]);
    }
  });

  // re-render fruits/bottle on resize so sizes track the viewport
  let rt;
  window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>setFlavor(current,true),200);});

  initPreloader();
  initMotion();
}
if(document.readyState!=='loading') init();
else document.addEventListener('DOMContentLoaded',init);
})();
