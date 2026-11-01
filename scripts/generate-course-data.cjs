const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../wwwroot');
const source=fs.readFileSync(path.join(root,'assets/pathways.js'),'utf8');
const departments=JSON.parse(fs.readFileSync(path.join(root,'assets/paths-data.json'),'utf8'));
const rows=source.slice(source.indexOf(' function row('),source.indexOf(' if(document.body.dataset.page'));
const definitions=source.slice(source.indexOf('   function design()'),source.indexOf("   $('#path-content').innerHTML"));
const models=source.match(/const modelSystems=([\s\S]*?);\s+function design/)[1];
function applications(c,slug){
 const t=c.title.toLowerCase(),app=(id,skill)=>({id,skill});
 if(/construction cloud|\bacc\b/.test(t))return [app('acc','Organise project documents, review versions and track coordination issues.')];
 if(/manag/.test(t))return [app('acc','Set up information delivery and team review workflows.'),app('excel','Track responsibilities, deliverables and model quality checks.')];
 if(/coordinat/.test(t))return [app('navisworks','Federate discipline models, run clash tests and record viewpoints.'),app('acc','Assign coordination issues and follow their resolution.')];
 if(c.path==='bim'){
 const result=[app(slug==='infrastructure'?'civil3d':'revit',slug==='infrastructure'?'Build surfaces, alignments and coordinated civil model information.':'Model discipline systems, manage parameters and produce coordinated views and schedules.')];
 if(/ai|automat|dynamo/.test(t))result.push(app('dynamo','Build visual rules to collect model data and automate repeated tasks.'),app('python','Prepare and validate model data with guided scripts.'));
 return result;
 }
 if(/etap/.test(t))return [app('etap','Build the electrical network and interpret load flow and fault study results.')];
 if(/etabs/.test(t))return [app('etabs','Define structural models, assign loads and review analysis results.')];
 if(/safe|foundation|slab/.test(t)&&slug==='structural')return [app('safe','Set up slab and foundation models and review design outputs.'),app('excel','Check assumptions and organise calculation results.')];
 if(slug==='infrastructure')return [app('civil3d','Develop civil geometry and prepare coordinated drawings.'),app('excel','Organise design inputs and calculation checks.')];
 if(/lighting|illumin/.test(t)&&slug==='electrical')return [app('dialux','Create lighting layouts and compare calculation results.'),app('autocad','Document lighting layouts and drawing annotations.')];
 if(slug==='architecture'&&/visualization|massing/.test(t))return [app('revit','Explore concept forms and prepare model views for design presentation.')];
 if(/shop|drawing|detail/.test(t))return [app('autocad','Develop coordinated details, annotations and drawing sheets.')];
 return [app('autocad','Translate system design into clear layouts and coordinated drawings.'),app('excel','Organise design assumptions, calculations and schedules.')];
}
const output=departments.map(([slug,name,description,img,paths])=>{
 const courses=vm.runInNewContext("const records=new Map();let serial=0;let currentPath='design';const esc=s=>String(s);const modelSystems="+models+";"+rows+definitions+"design();bim();JSON.stringify([...records.values()]);",{slug,name,description,img,paths});
 return {slug,name,image:img,courses:JSON.parse(courses).map(c=>({...c,applications:applications(c,slug)}))};
});
fs.writeFileSync(path.join(root,'assets/course-data.json'),JSON.stringify(output));
console.log('Generated',output.reduce((n,d)=>n+d.courses.length,0),'course entries');

