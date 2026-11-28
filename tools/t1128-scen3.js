module.exports=async({R,V,pt,ok,W,shot})=>{
  const st=await V.evaluate(()=>{const v=document.querySelector('video');return {wl:'wakeLock' in navigator,v:!!v,paused:v?v.paused:null,err:v&&v.error?v.error.code:null,dur:v?v.duration:null}});console.log(JSON.stringify(st));
  ok('video playing on iPhone',st.v&&st.paused===false,st);
  await V.click('[data-act=wleave]');await W(300);await V.click('[data-act=wleave2]');await W(500);
  const st2=await V.evaluate(()=>{const v=document.querySelector('video');return v?v.paused:'none'});ok('video paused after leaving',st2===true||st2==='none',st2);
};
