const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../wwwroot');
const source=fs.readFileSync(path.join(root,'assets/pathways.js'),'utf8');
const departments=JSON.parse(fs.readFileSync(path.join(root,'assets/paths-data.json'),'utf8'));
const rows=source.slice(source.indexOf(' function row('),source.indexOf(' if(document.body.dataset.page'));
const definitions=source.slice(source.indexOf('   function design()'),source.indexOf("   $('#path-content').innerHTML"));
const models=source.match(/const modelSystems=([\s\S]*?);\s+function design/)[1];
function applications(c,slug){
 const t=c.title.toLowerCase(),app=(id,skill)=>({id,skill});
 if(/inventor/.test(t))return [app('inventor','Create parametric parts, constrain assemblies and prepare fabrication drawings and bills of materials.')];
 if(c.path==='ai'&&!/revit/.test(t))return [app('python','Build AI-assisted data checks and documentation scripts, then review every output.'),app('excel','Structure engineering inputs, compare results and document human verification.')];
 if(/construction cloud|\bacc\b/.test(t))return [app('acc','Organise project documents, review versions and track coordination issues.')];
 if(/manag/.test(t))return [app('acc','Set up information delivery and team review workflows.'),app('excel','Track responsibilities, deliverables and model quality checks.')];
 if(/^bim coordination/.test(t))return [...(slug!=='infrastructure'?[app('revit','Prepare linked discipline models and review coordination changes.')]:[]),app('navisworks','Federate discipline models, run clash tests and record viewpoints.'),app('acc','Assign coordination issues and follow their resolution.')];
 if(c.path==='bim'||/revit/.test(t)){
 const result=[];if(slug!=='infrastructure'||/revit/.test(t))result.push(app('revit','Model discipline systems, manage parameters and produce coordinated views and schedules.'));if(slug==='infrastructure')result.push(app('civil3d','Build surfaces, alignments and coordinated civil model information.'));
 if(/ai|automat|dynamo/.test(t))result.push(app('dynamo','Build visual rules to collect model data and automate repeated tasks.'),app('python','Prepare and validate model data with guided scripts.'));
 return result;
 }
 if(slug==='mechanical'){
  if(/hvac load/.test(t))return [app('hap','Set up weather, spaces and schedules; calculate cooling and heating loads and review system sizing reports.'),app('excel','Check assumptions and organise calculation results.')];
  if(/ductwork|hydronic|chilled water/.test(t))return [app('cypehvac','Lay out duct or hydronic networks, size sections and review pressure loss and flow results.'),app('autocad','Develop coordinated details, annotations and drawing sheets.')];
  if(/water supply|plumbing|drainage|venting/.test(t))return [app('cypeplumbing','Lay out water supply or drainage networks, check sizing and review calculation reports.'),app('autocad','Develop coordinated details, annotations and drawing sheets.')];
  if(/firefighting/.test(t))return [app('cypefire','Model sprinkler networks, review hydraulic calculations and verify design inputs.'),app('autocad','Develop coordinated details, annotations and drawing sheets.')];
  if(/integrated project/.test(t))return [app('hap','Review system loads and sizing assumptions.'),app('cypehvac','Develop and check the HVAC network design.'),app('cypeplumbing','Develop and check water supply and drainage layouts.'),app('cypefire','Review the fire protection hydraulic workflow.'),app('revit','Coordinate discipline models and produce project views, schedules and shop drawings.')];
 }
 if(slug==='electrical'&&/lightning protection/.test(t))return [app('furse','Introduction to ABB Furse solutions and StrikeRisk: define risk assessment inputs and review the resulting protection strategy.'),app('autocad','Document protection layouts, bonding details and installation interfaces.')];
 if(slug==='structural'){
  if(/loads|columns|steel structures/.test(t))return [app('etabs','Define structural geometry, assign loads and review member forces and analysis results.'),app('excel','Check assumptions and organise calculation results.')];
  if(/reinforced concrete/.test(t))return [app('etabs','Model the building frame and review beam actions.'),app('safe','Set up slab and foundation models and review design outputs.')];
  if(/integrated project/.test(t))return [app('etabs','Coordinate building analysis inputs and review structural results.'),app('safe','Review the slab and foundation design workflow.'),app('revit','Coordinate discipline models and produce project views, schedules and shop drawings.')];
 }
 if(slug==='architecture'&&/visualization/.test(t))return [app('revit','Prepare the architectural model and coordinated presentation views.'),app('enscape','Develop real-time materials, lighting and presentation views from the model.')];
 if(slug==='architecture'&&/massing/.test(t))return [app('sketchup','Explore concept volumes and spatial alternatives.'),app('revit','Explore concept forms and prepare model views for design presentation.')];
 if(slug!=='infrastructure'&&/integrated project|shop drawings/.test(t))return [app('revit','Coordinate discipline models and produce project views, schedules and shop drawings.'),app('autocad','Develop coordinated details, annotations and drawing sheets.')];
 if(slug==='architecture'&&/plans, sections|facade|interior/.test(t))return [app('revit','Develop architectural layouts, assemblies, coordinated views and schedules.'),app('autocad','Develop coordinated details, annotations and drawing sheets.')];
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
 const courses=vm.runInNewContext("const records=new Map();let serial=0;let currentPath='design';const esc=s=>String(s);const modelSystems="+models+";"+rows+definitions+"design();bim();ai();JSON.stringify([...records.values()]);",{slug,name,description,img,paths});
 return {slug,name,image:img,courses:JSON.parse(courses).map(c=>({...c,applications:applications(c,slug)}))};
});
fs.writeFileSync(path.join(root,'assets/course-data.json'),JSON.stringify(output));
console.log('Generated',output.reduce((n,d)=>n+d.courses.length,0),'course entries');
