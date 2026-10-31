const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../wwwroot');
const source=fs.readFileSync(path.join(root,'assets/pathways.js'),'utf8');
const departments=JSON.parse(fs.readFileSync(path.join(root,'assets/paths-data.json'),'utf8'));
const rows=source.slice(source.indexOf(' function row('),source.indexOf(' if(document.body.dataset.page'));
const definitions=source.slice(source.indexOf('   function design()'),source.indexOf("   $('#path-content').innerHTML"));
const models=source.match(/const modelSystems=([\s\S]*?);\s+function design/)[1];
const output=departments.map(([slug,name,description,img,paths])=>{
 const courses=vm.runInNewContext("const records=new Map();let serial=0;let currentPath='design';const esc=s=>String(s);const modelSystems="+models+";"+rows+definitions+"design();bim();JSON.stringify([...records.values()]);",{slug,name,description,img,paths});
 return {slug,name,image:img,courses:JSON.parse(courses)};
});
fs.writeFileSync(path.join(root,'assets/course-data.json'),JSON.stringify(output));
console.log('Generated',output.reduce((n,d)=>n+d.courses.length,0),'course entries');

