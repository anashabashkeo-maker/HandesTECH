window.HandesAcademyRuntime={ready:fetch('assets/academy-config.json?v=19',{cache:'no-store'}).then(r=>r.ok?r.json():({enabled:false})).catch(()=>({enabled:false}))};

// Discreet owner shortcut. Authentication remains enforced by the server.
document.querySelectorAll('a.combined-brand').forEach(logo=>{
 let timer,origin,opened=false;
 const cancel=()=>{clearTimeout(timer);timer=undefined;origin=undefined;};
 const open=()=>{cancel();opened=true;location.assign(new URL('admin.html',document.baseURI));};
 logo.style.webkitTouchCallout='none';
 logo.addEventListener('pointerdown',event=>{
  cancel();opened=false;
  if(event.button!==0||event.isPrimary===false)return;
  origin={x:event.clientX,y:event.clientY,type:event.pointerType};
  timer=setTimeout(open,1500);
 });
 logo.addEventListener('pointermove',event=>{
  if(origin&&Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>12)cancel();
 });
 ['pointerup','pointercancel','pointerleave','dragstart'].forEach(type=>logo.addEventListener(type,cancel));
 logo.addEventListener('contextmenu',event=>{if(origin?.type==='touch')event.preventDefault();});
 logo.addEventListener('click',event=>{
  if(event.shiftKey||opened){event.preventDefault();event.stopImmediatePropagation();if(!opened)open();}
 },true);
 window.addEventListener('blur',cancel);
});
