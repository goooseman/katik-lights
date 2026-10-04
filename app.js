const scenes=[...document.querySelectorAll('.scene')];let current=0;
const backgroundLighthouse=document.querySelector('.lighthouse').cloneNode(true);backgroundLighthouse.classList.add('background-lighthouse');backgroundLighthouse.setAttribute('aria-hidden','true');document.querySelector('.atmosphere').append(backgroundLighthouse);
const islandHeroTitle=document.querySelector('.island-hero h2');if(islandHeroTitle)islandHeroTitle.innerHTML='На целый вечер —<br><em>островитяне.</em>';
const islandLifeTitle=document.querySelector('#island-life .island-block h3');if(islandLifeTitle)islandLifeTitle.innerHTML='Всего пять комнат.<br><em>И столько неба.</em>';
const historyIntro=document.querySelector('#island-history .island-block');if(historyIntro){const h=historyIntro.querySelector('h3');if(h)h.innerHTML='Маяк,<br>который чуть<br><em>не исчез.</em>';const ps=historyIntro.querySelectorAll('p');if(ps[1])ps[1].textContent='East Brother — не просто старый красивый маяк. Он однажды едва не исчез, а нынешняя маленькая гостиница стала способом его спасти.'}
const historyDates=[['1873','Скалу превращают в островной дом','На вершине крошечного острова срезали скалу и построили дом смотрителя, башню, туманный сигнал и систему сбора дождевой воды.'],['1874','В заливе зажгли первый свет','1 марта лампа Френеля впервые зажглась, а вскоре заработал туманный сигнал: в густом тумане звук был не менее важен, чем свет.'],['1969','Люди больше не нужны маяку','После почти ста лет жизни смотрителей Coast Guard автоматизировала станцию. Старый комплекс хотели снести, оставив только дешёвый навигационный огонь.'],['1979','Люди возвращаются ради самого места','Местные жители создали некоммерческую организацию и начали восстанавливать остров руками, грантами и пожертвованиями.'],['Сегодня','Ночь помогает ему жить','Пять комнат, ужины и гости теперь поддерживают дом, башню и остров — поэтому ночь здесь становится частью его продолжения.']];document.querySelectorAll('#island-history .history-dates details').forEach((detail,i)=>{const d=historyDates[i];if(!d)return;detail.querySelector('summary').innerHTML=`<span>${d[0]}</span>${d[1]}`;detail.querySelector('p').textContent=d[2]});
const islandGallery=document.querySelector('.island-gallery');if(islandGallery){const oldPhotos=[['assets/view.jpg','Вид на залив с East Brother Light Station','Залив становится нашим видом из окна.'],['assets/garden.jpg','Кресло в саду у белой ограды с видом на воду','Место, где можно просто посидеть рядом.'],['assets/island.jpg','Викторианское здание маяка','Сегодня нам не нужно возвращаться на берег.']];oldPhotos.reverse().forEach(([src,alt,caption])=>{const figure=document.createElement('figure');const img=document.createElement('img');img.src=src;img.alt=alt;img.loading='lazy';const figcaption=document.createElement('figcaption');figcaption.textContent=caption;figure.append(img,figcaption);islandGallery.insertBefore(figure,islandGallery.firstChild)})}
const datesContainer=document.querySelector('#island-history .history-dates');if(datesContainer){datesContainer.querySelectorAll('details').forEach(detail=>detail.remove());historyDates.forEach(([year,title,copy])=>{const detail=document.createElement('details');detail.open=true;const summary=document.createElement('summary');summary.innerHTML=`<span>${year}</span>${title}`;const p=document.createElement('p');p.textContent=copy;detail.append(summary,p);datesContainer.append(detail)})}
const duplicateIslandPhoto=document.querySelector('.island-gallery img[src*="East-Brother-Light-Station-03"]');if(duplicateIslandPhoto)duplicateIslandPhoto.closest('figure')?.remove();
const childcareLine=[...document.querySelectorAll('.promise p')].find(p=>p.textContent.includes('Обе эти ночи'));if(childcareLine)childcareLine.innerHTML='Обе эти ночи — наш с мамой подарок тебе.';
document.querySelectorAll('#island-history .history-dates details').forEach(detail=>{detail.open=true});
const progress=document.querySelector('.progress');for(let i=1;i<scenes.length;i++){let dot=document.createElement('i');progress.append(dot)}
function go(n){pauseMemories();current=Math.max(0,Math.min(n,scenes.length-1));scenes.forEach((s,i)=>{s.hidden=i!==current;s.classList.toggle('active',i===current)});document.body.dataset.scene=current;document.querySelector('#navigation').hidden=current===0||current===7;document.querySelector('#chapterCount').textContent=String(current).padStart(2,'0')+' / 07';[...progress.children].forEach((d,i)=>{d.className=i+1===current?'current':i+1<current?'past':''});window.scrollTo(0,0);if(current===2)requestAnimationFrame(()=>{reel.scrollTo({left:reel.children[albumPositions[album]].offsetLeft,behavior:'instant'});frameStatus()});if(current){const heading=scenes[current].querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true})}}
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>go(current+1)));document.querySelector('#back').onclick=()=>go(current-1);document.querySelector('#home').onclick=()=>go(0);document.querySelector('#replay').onclick=()=>go(0);
const reel=document.querySelector('#albumReel');
let album=0,frameIndex=0;const albumPositions=memories.map(()=>0);
const photoLight=document.querySelector('#photoLight');
let fullPhotoLight=false;
photoLight.onclick=()=>{
 fullPhotoLight=!fullPhotoLight;
 document.querySelector('#memoryAlbum').classList.toggle('lights-on',fullPhotoLight);
 photoLight.setAttribute('aria-pressed',String(fullPhotoLight));
 photoLight.setAttribute('aria-label',fullPhotoLight?'Выключить свет на фотографиях':'Включить свет на фотографиях');
 document.querySelector('#photoLightLabel').textContent=fullPhotoLight?'Выключить свет':'Включить свет';
 document.querySelector('#photoLightHint').textContent=fullPhotoLight?'Все кадры на свету.':'Коснись фото — посвети.';
};
function addPhotoBeam(figure,original){
 figure.classList.add('has-photo-beam');
 const lit=original.cloneNode(false);lit.className='photo-beam';lit.alt='';lit.setAttribute('aria-hidden','true');figure.append(lit);
 let fade;
 function shine(e){
  if(fullPhotoLight)return;
  if(e.pointerType==='touch')e.preventDefault();
  clearTimeout(fade);const rect=figure.getBoundingClientRect();
  figure.style.setProperty('--light-x',`${e.clientX-rect.left}px`);
  figure.style.setProperty('--light-y',`${e.clientY-rect.top}px`);
  figure.classList.add('beam-visible');
 }
 function fadeLight(){clearTimeout(fade);fade=setTimeout(()=>figure.classList.remove('beam-visible'),650)}
 figure.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')figure.setPointerCapture?.(e.pointerId);shine(e)},{passive:false});
 figure.addEventListener('pointermove',shine,{passive:false});
 figure.addEventListener('pointerup',fadeLight,{passive:true});
 figure.addEventListener('pointercancel',fadeLight,{passive:true});
 figure.addEventListener('pointerleave',fadeLight,{passive:true});
}
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function pauseMemories(){document.querySelectorAll('.album-reel video').forEach(v=>v.pause())}
function frameStatus(){
 const frames=[...reel.children]; if(!frames.length)return;
 frameIndex=frames.reduce((best,el,i)=>Math.abs(el.offsetLeft-reel.scrollLeft)<Math.abs(frames[best].offsetLeft-reel.scrollLeft)?i:best,0);
 albumPositions[album]=frameIndex;
 document.querySelector('#frameCount').textContent=`${frameIndex+1} / ${frames.length}`;
 document.querySelector('#prevFrame').disabled=frameIndex===0;
 document.querySelector('#nextFrame').disabled=frameIndex===frames.length-1;
 frames.forEach((f,i)=>{if(i!==frameIndex)f.querySelector('video')?.pause()});
}
function moveFrame(delta){const f=reel.children[Math.max(0,Math.min(frameIndex+delta,reel.children.length-1))];reel.scrollTo({left:f.offsetLeft,behavior:reduceMotion.matches?'instant':'smooth'})}
function showAlbum(n,focus=false){
 pauseMemories();album=Math.max(0,Math.min(n,memories.length-1));const m=memories[album];
 document.querySelector('#albumRegion').textContent=m.country+' · '+m.year;
 document.querySelector('#albumTitle').textContent=m.place;
 document.querySelector('#albumNumber').textContent=String(album+1).padStart(2,'0')+' / 10';
 reel.replaceChildren();reel.classList.toggle('single-frame',m.media.length===1);
 reel.classList.toggle('cover-frame',[0,4,5].includes(album));
 m.media.forEach((asset,i)=>{
 const figure=document.createElement('figure');figure.className='album-frame';
 const el=document.createElement(asset.type==='video'?'video':'img');
 if(asset.type==='video'){el.controls=true;el.playsInline=true;el.preload='none';el.poster=asset.poster;el.setAttribute('aria-label',`${m.place}, видео ${i+1}`);el.addEventListener('play',()=>ocean.stop())}
 else{el.alt=`${m.place} · ${m.year}. Наше воспоминание, фотография ${i+1}`;el.width=asset.width;el.height=asset.height;el.loading=i===0?'eager':'lazy';el.decoding='async'}
 el.src=asset.src;figure.append(el);if(asset.type==='image')addPhotoBeam(figure,el);reel.append(figure);
 });
 document.querySelector('#reelHint').textContent=m.media.length>1?'Листай кадры →':m.media[0].type==='video'?'Маленькое живое воспоминание':'Один кадр. Столько памяти.';
 document.querySelector('.reel-controls').hidden=m.media.length===1;
 const poem=document.querySelector('#albumPoem');poem.replaceChildren();m.poems.forEach(verse=>{const p=document.createElement('p');p.textContent=verse;poem.append(p)});
 document.querySelector('#prevAlbum').disabled=album===0;
 document.querySelector('#nextAlbumLabel').textContent=album===9?'ВПЕРЕДИ — ЕЩЁ ДВЕ ИСТОРИИ':'СЛЕДУЮЩИЙ БЕРЕГ';
 document.querySelector('#nextAlbumName').textContent=album===9?'А теперь — подарок':memories[album+1].place;
 document.querySelectorAll('#albumProgress button').forEach((b,i)=>{b.setAttribute('aria-current',String(i===album))});
 requestAnimationFrame(()=>{reel.scrollTo({left:reel.children[albumPositions[album]].offsetLeft,behavior:'instant'});frameStatus()});
 if(focus){document.querySelector('#albumTitle').focus({preventScroll:true});document.querySelector('#memoryAlbum').scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'})}
}
memories.forEach((m,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`${m.place}, ${m.year}`);b.innerHTML='<i></i>';b.onclick=()=>showAlbum(i,true);document.querySelector('#albumProgress').append(b)});
document.querySelector('#prevFrame').onclick=()=>moveFrame(-1);document.querySelector('#nextFrame').onclick=()=>moveFrame(1);
document.querySelector('#prevAlbum').onclick=()=>showAlbum(album-1,true);
document.querySelector('#nextAlbum').onclick=()=>album===9?go(3):showAlbum(album+1,true);
reel.addEventListener('scroll',frameStatus,{passive:true});reel.addEventListener('keydown',e=>{if(e.target.tagName==='VIDEO')return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveFrame(e.key==='ArrowRight'?1:-1)}});
window.addEventListener('resize',()=>{if(current===2)reel.scrollTo({left:reel.children[frameIndex].offsetLeft,behavior:'instant'})});
showAlbum(0);
const ocean=new OceanPlayer(document.querySelector('#sound'),document.querySelector('#soundLabel'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseMemories();ocean.hide()}else ocean.show()});
const queryParams=new URLSearchParams(window.location.search);
const requestedChapter=Number(queryParams.get('chapter'));
const requestedGift=queryParams.get('gift');
const initialChapter=Number.isInteger(requestedChapter)&&requestedChapter>=0&&requestedChapter<scenes.length?requestedChapter:requestedGift==='shore'?5:0;
go(initialChapter);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'navigate_story',description:'Открыть главу личной истории, от 0 (начало) до 7 (финал).',inputSchema:{type:'object',properties:{chapter:{type:'integer',minimum:0,maximum:7}},required:['chapter'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.chapter)||input.chapter<0||input.chapter>7)throw new Error('Chapter must be an integer from 0 to 7');go(input.chapter);return{chapter:current,title:scenes[current].querySelector('h1,h2').textContent}}})).catch(()=>{})}catch{}}
if('IntersectionObserver' in window){document.body.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}
