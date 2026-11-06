(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HandesPlanPDF=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(JsPDF,plan,fonts={}){
  const doc=new JsPDF({unit:'mm',format:'a4',compress:true}),rtl=plan.rtl,left=18,right=192,width=174,purple='#7038b5',ink='#29163d',muted='#766883';
  if(rtl){if(!fonts.regular||!fonts.bold)throw Error('Arabic fonts are unavailable. Please try again.');doc.addFileToVFS('Amiri-Regular.ttf',fonts.regular);doc.addFont('Amiri-Regular.ttf','Amiri','normal');doc.addFileToVFS('Amiri-Bold.ttf',fonts.bold);doc.addFont('Amiri-Bold.ttf','Amiri','bold');}
  const font=rtl?'Amiri':'helvetica';
  function text(value,y,size=11,colour=ink,bold=false,x=rtl?right:left,max=width){doc.setFont(font,bold?'bold':'normal');doc.setFontSize(rtl?size*1.22:size);doc.setTextColor(colour);doc.setR2L(false);const lines=doc.splitTextToSize(String(value||''),max);doc.text(lines,x,y,{align:rtl?'right':'left',lineHeightFactor:1.25,isInputVisual:false,isOutputVisual:true,isInputRtl:rtl,isOutputRtl:false});return y+lines.length*size*.47;}
  function box(y,h,colour='#f5effb'){doc.setFillColor(colour);doc.roundedRect(left,y,width,h,4,4,'F');}
  function header(page){doc.setFillColor('#faf7fe');doc.rect(0,0,210,297,'F');doc.setFillColor(purple);doc.roundedRect(left,15,10,12,2,2,'F');doc.setR2L(false);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor('#ffffff');doc.text('H',20,23.5);text(rtl?'هندستك':'HandesTECH',24,18,purple,true,rtl?right:33,155);doc.setDrawColor('#dfd0ed');doc.line(left,33,right,33);doc.setR2L(false);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(muted);doc.text('HandesTECH  |  '+page+' / 2',right,286,{align:'right'});text(plan.labels.privacy,280,8,muted,false,rtl?right:left,145);}
  header(1);text(plan.labels.title,47,25,purple,true);text(plan.labels.subtitle,58,11,muted);text(plan.discipline,68,11,ink,true);
  box(76,55);text(plan.labels.start,85,9,purple,true,rtl?right-6:left+6,162);let y=text(plan.path,95,17,ink,true,rtl?right-6:left+6,162);y=text(plan.labels.course+': '+plan.course,y+3,12,ink,true,rtl?right-6:left+6,162);text(plan.level,y+3,10,muted,false,rtl?right-6:left+6,162);
  text(plan.labels.schedule,143,12,purple,true);text(plan.weeklyHours+' '+plan.labels.perWeek+'  •  '+plan.estimatedHours+' '+plan.labels.hours+'  •  '+plan.estimatedWeeks+' '+plan.labels.weeks,152,11);
  text(plan.labels.scores,166,12,purple,true);y=175;
  for(const score of plan.scores){text(score.name,y,10,ink,false,rtl?right:left,140);doc.setR2L(false);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(score.tone.colour);doc.text(score.score+'%',rtl?left:right,y,{align:rtl?'left':'right'});doc.setFillColor('#e9e0f0');doc.roundedRect(left,y+3,width,3,1.5,1.5,'F');if(score.score){doc.setFillColor(score.tone.colour);doc.roundedRect(rtl?right-width*score.score/100:left,y+3,width*score.score/100,3,1,1,'F');}y+=17;}
  y+=4;text(plan.labels.focus,y,11,purple,true);y+=7;y=text(plan.focus.length?plan.focus.join(' • '):plan.path,y,10,ink,false,rtl?right:left,width);
  doc.addPage();header(2);text(plan.labels.steps,47,22,purple,true);y=57;
  for(const stage of plan.stages){box(y,36);text(stage.weekLabel+' • '+stage.hours+' '+plan.labels.hours,y+7,9,purple,true,rtl?right-6:left+6,162);text(stage.title,y+14,12,ink,true,rtl?right-6:left+6,162);text(stage.task,y+21,9,ink,false,rtl?right-6:left+6,162);y+=40;}
  text(plan.labels.tools,y+1,12,purple,true);y+=9;
  for(const tool of plan.tools){y=text(tool.name+' — '+tool.skill,y,9,ink,false,rtl?right:left,width)+2;}
  const linkY=Math.max(y+4,249);text(plan.labels.open,linkY,11,purple,true);doc.link(left,linkY-5,width,8,{url:plan.courseUrl});text(plan.labels.note,linkY+10,8,muted,false,rtl?right:left,width);
  doc.setProperties({title:plan.labels.title+' | HandesTECH',subject:plan.path,author:'HandesTECH',creator:'HandesTECH browser learning planner'});return doc;
 }
 async function download(plan){
  if(!globalThis.jspdf){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/vendor/jspdf.umd.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('The PDF tools could not load. Please try again.'));};document.head.append(script);});}
  const fonts={};if(plan.rtl){for(const [key,name]of [['regular','Amiri-Regular'],['bold','Amiri-Bold']]){const response=await fetch('assets/fonts/'+name+'.ttf');if(!response.ok)throw Error('Arabic fonts could not load.');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));fonts[key]=btoa(binary);}}
  create(globalThis.jspdf.jsPDF,plan,fonts).save('HandesTECH-learning-plan-'+plan.lang+'.pdf');
 }
 return {create,download};
});
