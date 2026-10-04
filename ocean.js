class OceanPlayer {
 constructor(button,label){
  this.button=button;this.label=label;this.wanted=false;this.request=0;this.offset=0;
  this.url='assets/audio/waves-against-rocks-loop.mp3';
  button.onclick=()=>this.wanted?this.stop():this.start();
 }
 prepareSession(){
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}
 }
 createAudio(){
  if(this.context||this.native)return;
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(AudioContext){
   try{this.context=new AudioContext()}catch{}
  }
  if(!this.context){
   this.native=new Audio(this.url);this.native.loop=true;this.native.preload='auto';
   this.native.playsInline=true;this.native.setAttribute('playsinline','');this.native.volume=.42;
  }else{
   const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   if(ios&&!navigator.audioSession){
    this.bridge=new Audio('assets/audio/playback-silence.wav');this.bridge.loop=true;
    this.bridge.preload='auto';this.bridge.playsInline=true;this.bridge.setAttribute('playsinline','');
    this.bridge.muted=false;this.bridge.volume=1;
   }
  }
 }
 loadBuffer(){
  if(!this.loading){
   this.loading=fetch(this.url).then(response=>{
    if(!response.ok)throw new Error('Ocean recording unavailable');
    return response.arrayBuffer();
   }).then(data=>new Promise((resolve,reject)=>this.context.decodeAudioData(data,resolve,reject)))
    .then(buffer=>{this.buffer=buffer;return buffer})
    .catch(error=>{this.loading=null;throw error});
  }
  return this.loading;
 }
 update(label){
  this.button.setAttribute('aria-pressed',String(this.wanted));
  this.button.setAttribute('aria-busy',String(this.wanted&&!this.source&&!this.native));
  this.label.textContent=label||(this.wanted?'Океан звучит':'Включить океан');
 }
 async start(){
  this.wanted=true;const request=++this.request;
  pauseMemories();this.createAudio();this.prepareSession();this.update('Океан загружается…');
  try{
   // Unlock every audio route directly inside the tap, before loading/decoding.
   if(this.native){
    await this.native.play();
   }else{
    const resume=this.context.resume();
    const bridge=this.bridge?.play();
    await Promise.all([resume,bridge,this.loadBuffer()]);
   }
   if(request!==this.request||!this.wanted||document.hidden)return;
   if(this.context){
    if(this.context.state!=='running')throw new Error('Audio playback interrupted');
    this.playBuffer();
   }
   this.update();
  }catch(error){
   if(request!==this.request)return;
   this.stop();this.update('Нажми ещё раз');
  }
 }
 playBuffer(){
  const context=this.context;
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=this.buffer;source.loop=true;
  // Loop the decoded PCM in the audio renderer. No ended handler or JS timer
  // restarts the recording, so the end-to-start transition has no playback gap.
  source.loopStart=0;source.loopEnd=this.buffer.duration;
  gain.gain.setValueAtTime(0,context.currentTime);
  gain.gain.linearRampToValueAtTime(.42,context.currentTime+.12);
  source.connect(gain).connect(context.destination);
  this.startedAt=context.currentTime;this.source=source;this.gain=gain;
  source.onended=()=>{source.disconnect();gain.disconnect()};
  source.start(0,this.offset%this.buffer.duration);
 }
 pause(){
  ++this.request;
  if(this.source){
   this.offset=(this.offset+this.context.currentTime-this.startedAt)%this.buffer.duration;
   this.gain.gain.cancelScheduledValues(this.context.currentTime);
   this.gain.gain.setValueAtTime(this.gain.gain.value,this.context.currentTime);
   this.gain.gain.linearRampToValueAtTime(0,this.context.currentTime+.08);
   this.source.stop(this.context.currentTime+.08);this.source=null;this.gain=null;
  }
  this.native?.pause();this.bridge?.pause();
 }
 stop(){
  this.wanted=false;this.pause();this.offset=0;
  if(this.native)this.native.currentTime=0;
  this.update();
 }
 hide(){
  this.pause();
 }
 show(){
  if(this.wanted)this.start();
 }
}
