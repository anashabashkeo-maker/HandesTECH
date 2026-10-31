const courses = [
  {
    "id": "course-1",
    "category": "Electrical Power",
    "title": "Electrical Building Design",
    "level": "Foundation",
    "image": "course-1",
    "description": "Loads, circuits and a coordinated building design.",
    "prerequisite": "Electrical fundamentals",
    "outcome": "Develop a small building electrical design package.",
    "topics": [
      "Load estimation & demand",
      "Distribution boards & single-line diagrams",
      "Cable sizing & voltage-drop workflow",
      "Drawings, schedules & design checks"
    ]
  },
  {
    "id": "course-2",
    "category": "Electrical Power",
    "title": "Lighting Design with DIALux",
    "level": "Foundation",
    "image": "course-2",
    "description": "Turn spaces into practical lighting studies.",
    "prerequisite": "Basic lighting terminology",
    "outcome": "Prepare and review a lighting study.",
    "topics": [
      "Spaces & luminaire selection",
      "Calculation surfaces & lighting criteria",
      "Results, uniformity & review",
      "Reports & drawing coordination"
    ]
  },
  {
    "id": "course-3",
    "category": "Telecommunications",
    "title": "Low-Current Systems Design",
    "level": "Intermediate",
    "image": "course-3",
    "description": "Coordinate the systems behind connected buildings.",
    "prerequisite": "Building services fundamentals",
    "outcome": "Develop coordinated low-current layouts.",
    "topics": [
      "Structured cabling & equipment rooms",
      "CCTV & access-control layouts",
      "Pathways, containment & interfaces",
      "Schedules, drawings & quantities"
    ]
  },
  {
    "id": "course-4",
    "category": "Electrical Power",
    "title": "Power Systems with ETAP",
    "level": "Intermediate",
    "image": "course-4",
    "description": "Build the model behind the power study.",
    "prerequisite": "Electrical circuits and power-system fundamentals",
    "outcome": "Build a study model and interpret its results.",
    "topics": [
      "Network model & equipment data",
      "Load-flow study workflow",
      "Short-circuit study workflow",
      "Protection coordination & reporting"
    ]
  },
  {
    "id": "course-5",
    "category": "Electrical Power",
    "title": "Solar PV Design with PVSyst",
    "level": "Intermediate",
    "image": "course-5",
    "description": "From solar resource to system performance.",
    "prerequisite": "Basic electrical design",
    "outcome": "Prepare a preliminary PV system study.",
    "topics": [
      "Site resource & system assumptions",
      "Modules, inverters & configuration",
      "Shading, losses & energy yield",
      "Simulation review & reporting"
    ]
  },
  {
    "id": "course-6",
    "category": "BIM & VDC",
    "title": "Revit for Buildings",
    "level": "Foundation",
    "image": "course-6",
    "description": "Model the systems. Understand the building.",
    "prerequisite": "Basic drawing literacy",
    "outcome": "Create a coordinated building model and sheets.",
    "topics": [
      "Project setup, levels & links",
      "Lighting, power & electrical systems",
      "Families, schedules & quantities",
      "Sheets & model checks"
    ]
  },
  {
    "id": "course-7",
    "category": "BIM & VDC",
    "title": "Revit Families & Parameters",
    "level": "Intermediate",
    "image": "course-7",
    "description": "Create reusable, data-rich model content.",
    "prerequisite": "Basic Revit modeling",
    "outcome": "Build a reusable parametric family.",
    "topics": [
      "Templates & reference planes",
      "Constraints & type parameters",
      "Shared parameters & schedules",
      "Testing, naming & library structure"
    ]
  },
  {
    "id": "course-8",
    "category": "BIM & VDC",
    "title": "Navisworks Clash Coordination",
    "level": "Intermediate",
    "image": "course-8",
    "description": "Find issues. Coordinate the solution.",
    "prerequisite": "Experience reading multidisciplinary models",
    "outcome": "Prepare a clash review and issue report.",
    "topics": [
      "Model federation & search sets",
      "Clash rules, tolerances & tests",
      "Grouping, viewpoints & issue tracking",
      "Coordination review & reporting"
    ]
  },
  {
    "id": "course-9",
    "category": "BIM & VDC",
    "title": "4D & 5D BIM Workflows",
    "level": "Advanced",
    "image": "course-9",
    "description": "Connect models with time and cost.",
    "prerequisite": "BIM coordination and quantity basics",
    "outcome": "Create a sample sequence and quantity-cost link.",
    "topics": [
      "Model breakdown & schedule mapping",
      "4D sequencing & simulation review",
      "Quantity extraction & cost mapping",
      "Progress tracking & validation"
    ]
  },
  {
    "id": "course-10",
    "category": "BIM & VDC",
    "title": "BIM Delivery & ISO 19650 Concepts",
    "level": "Intermediate",
    "image": "course-10",
    "description": "Structure information for better delivery.",
    "prerequisite": "Experience using project models or drawings",
    "outcome": "Prepare a sample information-delivery checklist.",
    "topics": [
      "Information requirements & responsibilities",
      "BEP concepts & common data environments",
      "Naming, status & revision control",
      "QA/QC checks & delivery review"
    ]
  },
  {
    "id": "course-11",
    "category": "Infrastructure",
    "title": "Revit for Infrastructure",
    "level": "Intermediate",
    "image": "course-11",
    "description": "Connect utilities to the bigger picture.",
    "prerequisite": "Basic Revit modeling",
    "outcome": "Develop a coordinated utility model.",
    "topics": [
      "Site context & shared coordinates",
      "Utility routes, chambers & duct banks",
      "Linked-model coordination",
      "Quantity take-offs & deliverables"
    ]
  },
  {
    "id": "course-12",
    "category": "Infrastructure",
    "title": "Civil 3D: Roads & Networks",
    "level": "Foundation",
    "image": "course-12",
    "description": "From terrain to coordinated corridors.",
    "prerequisite": "Basic CAD and civil drawing literacy",
    "outcome": "Build a sample road and network workflow.",
    "topics": [
      "Surfaces, alignments & profiles",
      "Corridors & grading workflows",
      "Pipe networks & coordination",
      "Data shortcuts & quantities"
    ]
  },
  {
    "id": "course-13",
    "category": "Infrastructure",
    "title": "Site Grading & Earthworks",
    "level": "Intermediate",
    "image": "course-13",
    "description": "Read the terrain. Shape the site.",
    "prerequisite": "Civil 3D surfaces basics",
    "outcome": "Prepare a grading study and earthwork comparison.",
    "topics": [
      "Existing & proposed surfaces",
      "Feature lines & grading controls",
      "Drainage intent & slope checks",
      "Cut/fill volumes & review"
    ]
  },
  {
    "id": "course-14",
    "category": "Infrastructure",
    "title": "Dry Utilities & Street Lighting",
    "level": "Intermediate",
    "image": "course-14",
    "description": "Plan utility routes that work together.",
    "prerequisite": "Electrical or infrastructure fundamentals",
    "outcome": "Develop a coordinated utility corridor layout.",
    "topics": [
      "Power routes & utility reservations",
      "Duct banks, chambers & crossings",
      "Street-lighting layouts & interfaces",
      "Coordination, quantities & BOQs"
    ]
  },
  {
    "id": "course-15",
    "category": "Telecommunications",
    "title": "Smart City & Telecom",
    "level": "Intermediate",
    "image": "course-15",
    "description": "Design the connections behind the city.",
    "prerequisite": "Basic telecom or utility-network knowledge",
    "outcome": "Prepare a telecom corridor concept and quantities.",
    "topics": [
      "Telecom corridors & fiber routes",
      "Duct banks, chambers & cabinets",
      "Power, lighting & utility interfaces",
      "Route coordination, drawings & BOQs"
    ]
  },
  {
    "id": "course-16",
    "category": "Automation",
    "title": "Dynamo & Revit Automation",
    "level": "Intermediate",
    "image": "course-16",
    "description": "Less repetition. More engineering.",
    "prerequisite": "Working knowledge of Revit",
    "outcome": "Build a reusable model automation workflow.",
    "topics": [
      "Visual scripting & data structures",
      "Parameters, model data & Excel",
      "Python & Revit API foundations",
      "Reusable tools & validation"
    ]
  },
  {
    "id": "course-17",
    "category": "Automation",
    "title": "Python & pyRevit Tools",
    "level": "Advanced",
    "image": "course-17",
    "description": "Turn production tasks into practical tools.",
    "prerequisite": "Basic Python and Revit experience",
    "outcome": "Create a small tool with validation and feedback.",
    "topics": [
      "Revit API & element collection",
      "Transactions & parameter updates",
      "Selection, forms & user feedback",
      "Error handling & tool packaging"
    ]
  },
  {
    "id": "course-18",
    "category": "Automation",
    "title": "AutoLISP & Excel VBA Workflows",
    "level": "Intermediate",
    "image": "course-18",
    "description": "Connect drawing tasks and project data.",
    "prerequisite": "AutoCAD and Excel basics",
    "outcome": "Automate a repeatable drafting or reporting task.",
    "topics": [
      "AutoLISP selection & entity data",
      "Drafting routines & validation",
      "Excel VBA data preparation",
      "Quantity reports & workflow checks"
    ]
  },
  {
    "id": "course-19",
    "category": "Structural",
    "title": "Structural Analysis & Load Paths",
    "level": "Foundation",
    "image": "course-19",
    "description": "Read a structural system and build a simple analysis model.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Read a structural system and build a simple analysis model.",
    "topics": [
      "Loads & combinations",
      "Load paths & stability",
      "Analysis models",
      "Results & checks"
    ]
  },
  {
    "id": "course-20",
    "category": "Structural",
    "title": "Reinforced Concrete Design",
    "level": "Intermediate",
    "image": "course-20",
    "description": "Develop a concrete member design and detailing workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a concrete member design and detailing workflow.",
    "topics": [
      "Slabs & beams",
      "Columns & walls",
      "Serviceability",
      "Reinforcement detailing"
    ]
  },
  {
    "id": "course-21",
    "category": "Structural",
    "title": "Steel Structures & Connections",
    "level": "Intermediate",
    "image": "course-21",
    "description": "Develop a steel member and connection design workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a steel member and connection design workflow.",
    "topics": [
      "Steel member behavior",
      "Member sizing",
      "Connection concepts",
      "Fabrication drawings"
    ]
  },
  {
    "id": "course-22",
    "category": "Structural",
    "title": "ETABS & SAFE: Building Structures",
    "level": "Intermediate",
    "image": "course-22",
    "description": "Build and review a sample building analysis model.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Build and review a sample building analysis model.",
    "topics": [
      "Model setup & loading",
      "Lateral analysis",
      "Slab & foundation modeling",
      "Result validation"
    ]
  },
  {
    "id": "course-23",
    "category": "Structural",
    "title": "Revit Structure & Reinforcement",
    "level": "Intermediate",
    "image": "course-23",
    "description": "Create structural models and sample reinforcement sheets.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Create structural models and sample reinforcement sheets.",
    "topics": [
      "Structural modeling",
      "Analytical coordination",
      "Rebar workflows",
      "Sheets & schedules"
    ]
  },
  {
    "id": "course-24",
    "category": "Architecture",
    "title": "Architectural Design Fundamentals",
    "level": "Foundation",
    "image": "course-24",
    "description": "Turn a brief into a coherent architectural concept.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Turn a brief into a coherent architectural concept.",
    "topics": [
      "Brief & site response",
      "Spatial planning",
      "Circulation & massing",
      "Design presentation"
    ]
  },
  {
    "id": "course-25",
    "category": "Architecture",
    "title": "Revit Architecture: Concept to Sheets",
    "level": "Foundation",
    "image": "course-25",
    "description": "Produce a small architectural model and drawing set.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Produce a small architectural model and drawing set.",
    "topics": [
      "Levels & spatial setup",
      "Walls, floors & roofs",
      "Rooms & schedules",
      "Plans, sections & sheets"
    ]
  },
  {
    "id": "course-26",
    "category": "Architecture",
    "title": "Facade & Envelope Detailing",
    "level": "Intermediate",
    "image": "course-26",
    "description": "Develop a coordinated set of envelope detail studies.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a coordinated set of envelope detail studies.",
    "topics": [
      "Envelope systems",
      "Thermal & moisture concepts",
      "Junctions & interfaces",
      "Detail drawing review"
    ]
  },
  {
    "id": "course-27",
    "category": "Architecture",
    "title": "Interior Fit-Out & Documentation",
    "level": "Intermediate",
    "image": "course-27",
    "description": "Prepare an interior documentation workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Prepare an interior documentation workflow.",
    "topics": [
      "Space planning",
      "Ceilings & finishes",
      "Joinery detailing",
      "Schedules & coordination"
    ]
  },
  {
    "id": "course-28",
    "category": "Architecture",
    "title": "Architectural Visualization",
    "level": "Intermediate",
    "image": "course-28",
    "description": "Create a clear visual presentation of a design.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Create a clear visual presentation of a design.",
    "topics": [
      "Camera & composition",
      "Materials & lighting",
      "Rendering workflow",
      "Presentation review"
    ]
  },
  {
    "id": "course-29",
    "category": "Mechanical",
    "title": "HVAC Design & Load Calculations",
    "level": "Foundation",
    "image": "course-29",
    "description": "Prepare a sample HVAC load and system selection study.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Prepare a sample HVAC load and system selection study.",
    "topics": [
      "Comfort & design criteria",
      "Cooling & heating loads",
      "System selection",
      "Equipment schedules"
    ]
  },
  {
    "id": "course-30",
    "category": "Mechanical",
    "title": "Ductwork & Ventilation Design",
    "level": "Intermediate",
    "image": "course-30",
    "description": "Develop a ventilation layout and sizing workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a ventilation layout and sizing workflow.",
    "topics": [
      "Airflow requirements",
      "Duct sizing",
      "Pressure loss & fans",
      "Coordination & drawings"
    ]
  },
  {
    "id": "course-31",
    "category": "Mechanical",
    "title": "Plumbing & Drainage Design",
    "level": "Foundation",
    "image": "course-31",
    "description": "Prepare a sample water supply and drainage layout.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Prepare a sample water supply and drainage layout.",
    "topics": [
      "Demand & fixtures",
      "Water supply sizing",
      "Drainage & venting",
      "Layouts & schedules"
    ]
  },
  {
    "id": "course-32",
    "category": "Mechanical",
    "title": "Firefighting System Design",
    "level": "Intermediate",
    "image": "course-32",
    "description": "Develop a sample fire protection coordination workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a sample fire protection coordination workflow.",
    "topics": [
      "Design basis & criteria",
      "System layouts",
      "Hydraulic workflow",
      "Drawings & coordination"
    ]
  },
  {
    "id": "course-33",
    "category": "Mechanical",
    "title": "Revit Mechanical & MEP Coordination",
    "level": "Intermediate",
    "image": "course-33",
    "description": "Create and coordinate a mechanical services model.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Create and coordinate a mechanical services model.",
    "topics": [
      "Mechanical model setup",
      "Ducts & piping",
      "Systems & schedules",
      "Coordination & sheets"
    ]
  },
  {
    "id": "course-34",
    "category": "Electrical Power",
    "title": "LV Power Distribution & Protection",
    "level": "Intermediate",
    "image": "course-34",
    "description": "Develop a low-voltage distribution concept and schedules.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a low-voltage distribution concept and schedules.",
    "topics": [
      "Distribution architecture",
      "Load schedules",
      "Protection selection",
      "Single-line diagrams"
    ]
  },
  {
    "id": "course-35",
    "category": "Electrical Power",
    "title": "Cable Sizing & Voltage Drop",
    "level": "Intermediate",
    "image": "course-35",
    "description": "Build a documented cable-sizing calculation workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Build a documented cable-sizing calculation workflow.",
    "topics": [
      "Installation methods",
      "Current capacity",
      "Voltage drop",
      "Short-circuit withstand"
    ]
  },
  {
    "id": "course-36",
    "category": "Electrical Power",
    "title": "Earthing & Lightning Protection",
    "level": "Intermediate",
    "image": "course-36",
    "description": "Prepare an earthing and lightning protection concept.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Prepare an earthing and lightning protection concept.",
    "topics": [
      "Design criteria",
      "Earthing arrangements",
      "Lightning zones",
      "Bonding & documentation"
    ]
  },
  {
    "id": "course-37",
    "category": "Electrical Power",
    "title": "MV Networks & Substation Design",
    "level": "Advanced",
    "image": "course-37",
    "description": "Develop a medium-voltage network concept.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a medium-voltage network concept.",
    "topics": [
      "Network architecture",
      "Transformers & switchgear",
      "Protection interfaces",
      "Layouts & coordination"
    ]
  },
  {
    "id": "course-38",
    "category": "Telecommunications",
    "title": "Structured Cabling & Fiber Design",
    "level": "Foundation",
    "image": "course-38",
    "description": "Prepare a structured cabling concept and schedules.",
    "prerequisite": "Basic engineering or drawing literacy",
    "outcome": "Prepare a structured cabling concept and schedules.",
    "topics": [
      "Network topology",
      "Copper & fiber links",
      "Racks & pathways",
      "Schedules & testing"
    ]
  },
  {
    "id": "course-39",
    "category": "Telecommunications",
    "title": "ICT Rooms & Data Centre Infrastructure",
    "level": "Intermediate",
    "image": "course-39",
    "description": "Develop a coordinated ICT room layout.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a coordinated ICT room layout.",
    "topics": [
      "Rack layouts",
      "Resilience concepts",
      "Power & cooling interfaces",
      "Containment & coordination"
    ]
  },
  {
    "id": "course-40",
    "category": "Telecommunications",
    "title": "CCTV, Access Control & Security Systems",
    "level": "Intermediate",
    "image": "course-40",
    "description": "Prepare an integrated security systems design concept.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Prepare an integrated security systems design concept.",
    "topics": [
      "Coverage planning",
      "Device selection",
      "Network & power",
      "Layouts & schedules"
    ]
  },
  {
    "id": "course-41",
    "category": "Telecommunications",
    "title": "OSP Fiber & Telecom Networks",
    "level": "Intermediate",
    "image": "course-41",
    "description": "Develop an outside-plant fiber route and documentation workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop an outside-plant fiber route and documentation workflow.",
    "topics": [
      "Route planning",
      "Ducts & chambers",
      "Fiber allocation",
      "Splicing & documentation"
    ]
  },
  {
    "id": "course-42",
    "category": "Infrastructure",
    "title": "Water Networks & Hydraulic Modeling",
    "level": "Intermediate",
    "image": "course-42",
    "description": "Build a sample water network model.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Build a sample water network model.",
    "topics": [
      "Demand allocation",
      "Network configuration",
      "Pressure & flow checks",
      "Model review"
    ]
  },
  {
    "id": "course-43",
    "category": "Infrastructure",
    "title": "Stormwater & Sewer Networks",
    "level": "Intermediate",
    "image": "course-43",
    "description": "Develop a drainage network and profile workflow.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a drainage network and profile workflow.",
    "topics": [
      "Catchments & design flows",
      "Pipe networks",
      "Profiles & levels",
      "Capacity checks"
    ]
  },
  {
    "id": "course-44",
    "category": "Infrastructure",
    "title": "Road Design & Junction Geometry",
    "level": "Intermediate",
    "image": "course-44",
    "description": "Develop a road geometry and profile study.",
    "prerequisite": "Discipline fundamentals",
    "outcome": "Develop a road geometry and profile study.",
    "topics": [
      "Design criteria",
      "Horizontal geometry",
      "Vertical profiles",
      "Junction coordination"
    ]
  }
];
 courses.push(...[{"id": "course-45", "category": "Electrical Power", "title": "Revit + AI for Electrical Engineering", "level": "Intermediate", "image": "power", "description": "Panel schedules \u2192 checked model data", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "Panel schedules \u2192 checked model data. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Extract circuit and panel data from Revit", "AI-assisted Python for schedule QA", "Flag missing loads and inconsistent parameters", "Review calculations and approve model changes"], "ai": true}, {"id": "course-46", "category": "Architecture", "title": "Revit + AI for Architecture", "level": "Intermediate", "image": "architecture", "description": "Room data \u2192 design options", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "Room data \u2192 design options. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Extract room and area schedules", "AI-assisted Dynamo scripts for repetitive modeling", "Compare spatial options against a brief", "Review geometry, constraints and drawings"], "ai": true}, {"id": "course-47", "category": "Structural", "title": "Revit + AI for Structural Engineering", "level": "Intermediate", "image": "structure", "description": "Member data \u2192 coordinated documentation", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "Member data \u2192 coordinated documentation. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Collect structural member and material data", "AI-assisted parameter and naming checks", "Prepare reinforcement schedule review tools", "Engineer review of analytical assumptions and outputs"], "ai": true}, {"id": "course-48", "category": "Mechanical", "title": "Revit + AI for Mechanical Engineering", "level": "Intermediate", "image": "mechanical", "description": "System data \u2192 coordinated MEP", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "System data \u2192 coordinated MEP. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Extract equipment and system data", "AI-assisted scripts for schedule consistency", "Flag unconnected systems and missing parameters", "Review load assumptions and coordination issues"], "ai": true}, {"id": "course-49", "category": "Telecommunications", "title": "Revit + AI for Telecom", "level": "Intermediate", "image": "telecom", "description": "Device data \u2192 connected systems", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "Device data \u2192 connected systems. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Extract devices, racks and containment data", "AI-assisted device schedule QA", "Compare naming and connectivity requirements", "Review network assumptions and model updates"], "ai": true}, {"id": "course-50", "category": "Infrastructure", "title": "Revit + AI for Infrastructure", "level": "Intermediate", "image": "roads", "description": "Linked models \u2192 utility coordination", "prerequisite": "Working knowledge of Revit and discipline fundamentals", "outcome": "Linked models \u2192 utility coordination. Build a small reviewed automation tool; AI outputs require engineering validation.", "topics": ["Read linked Revit utility model data", "AI-assisted quantity and parameter checks", "Review coordinates and utility interfaces", "Validate outputs with civil design information"], "ai": true}]);


courses.forEach(c=>c.formats=['Recorded','Live group','VIP 1:1']);
const subjectPhotos={'Electrical Power':'power','Telecommunications':'telecom','Structural':'structure','Architecture':'architecture','Mechanical':'mechanical','Infrastructure':'roads','BIM & VDC':'architecture','Automation':'code'};
courses.forEach(c=>{c.photo=subjectPhotos[c.category]; if(c.id==='course-5')c.photo='solar';if(c.id==='course-2')c.photo='lighting';if(c.id==='course-27')c.photo='interior';c.badge=c.ai?'New · AI workflow':['course-1','course-6','course-16','course-25','course-29','course-38'].includes(c.id)?'Recommended':c.level==='Foundation'?'Start here':'Project skills';});
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved=new Set();let storageAvailable=true;
try{const value=JSON.parse(localStorage.getItem('HandesTECH-saved-courses')||'[]');if(Array.isArray(value))saved=new Set(value.filter(id=>courses.some(c=>c.id===id)));}catch{storageAvailable=false;}
let category='All courses';let activeCourse=null;let opener=null;let toastTimer;
const tabs=[...document.querySelectorAll('[data-tab]')];
const descriptions={"All courses": ["Find your next skill.", "Choose a discipline. Explore a syllabus."], "Saved": ["Your shortlist.", "Saved on this browser."], "Structural": ["Structural", "Explore the design, tools and delivery workflows."], "Architecture": ["Architecture", "Explore the design, tools and delivery workflows."], "Mechanical": ["Mechanical", "Explore the design, tools and delivery workflows."], "Electrical Power": ["Electrical Power", "Explore the design, tools and delivery workflows."], "Telecommunications": ["Telecommunications", "Explore the design, tools and delivery workflows."], "Infrastructure": ["Infrastructure", "Explore the design, tools and delivery workflows."], "BIM & VDC": ["BIM & VDC", "Explore the design, tools and delivery workflows."], "Automation": ["Automation", "Explore the design, tools and delivery workflows."]};
let aiOnly=false;let visibleLimit=9;
function filteredCourses(){const query=$('#course-search').value.trim().toLowerCase();const level=$('#course-level').value;const format=$('#course-format').value;return courses.filter(c=>(!aiOnly||c.ai)&&(category==='All courses'||(category==='Saved'?saved.has(c.id):c.category===category))&&(format==='all'||c.formats.includes(format))&&(level==='all'||c.level===level)&&[c.title,c.category,c.description,...c.topics].join(' ').toLowerCase().includes(query));}
function card(c){const e=escapeHTML;return `<article class="course"><div class="course-image"><img src="assets/${c.photo}.jpg" alt="Subject photograph for ${e(c.title)}" width="1536" height="1024" loading="lazy"><span class="category-label">${e(c.category)}</span><button class="save-course" data-save="${c.id}" aria-pressed="${saved.has(c.id)}" aria-label="${saved.has(c.id)?'Unsave':'Save'} ${e(c.title)}">${saved.has(c.id)?'♥':'♡'}</button></div><div class="course-body"><span class="course-format-badge ${c.ai?'ai-badge':''}">${e(c.badge)}</span><p class="course-level">${e(c.level)}</p><h3>${e(c.title)}</h3><button class="details-button" data-open="${c.id}">Explore course <span aria-hidden="true">↗</span></button></div></article>`;}
function render(){const list=filteredCourses();$('#course-list').innerHTML=list.slice(0,visibleLimit).map(card).join('');document.dispatchEvent(new Event('catalog:render'));$('#result-count').textContent=`${list.length} ${list.length===1?'course':'courses'}${category==='All courses'?' available':' in '+category}`;$('#empty-state').hidden=list.length>0;const noSaved=category==='Saved'&&saved.size===0;$('#empty-title').textContent=noSaved?'Your shortlist starts here':'No courses found';$('#empty-copy').textContent=noSaved?'Tap the heart on any course to save it here.':'Try another topic or clear your filters.';$('#reset-filters').hidden=!aiOnly&&!$('#course-search').value&&$('#course-level').value==='all'&&$('#course-format').value==='all';$('#department-title').textContent=descriptions[category][0];$('#department-description').textContent=descriptions[category][1];tabs.forEach(t=>{const active=t.dataset.tab===category;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;t.querySelector('.tab-count').textContent=t.dataset.tab==='All courses'?courses.length:t.dataset.tab==='Saved'?saved.size:courses.filter(c=>c.category===t.dataset.tab).length;if(active)$('#catalog-panel').setAttribute('aria-labelledby',t.id);});}
function selectTab(tab){visibleLimit=9;category=tab.dataset.tab;render();}
function wireTabs(elements,onSelect){elements.forEach((t,i)=>{t.addEventListener('click',()=>onSelect(t));t.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%elements.length;if(e.key==='ArrowLeft')n=(i-1+elements.length)%elements.length;if(e.key==='Home')n=0;if(e.key==='End')n=elements.length-1;if(n!==undefined){e.preventDefault();elements[n].focus();onSelect(elements[n]);}});});}
wireTabs(tabs,selectTab);
$('#course-search').addEventListener('input',()=>{visibleLimit=9;render();});$('#course-level').addEventListener('change',render);$('#course-format').addEventListener('change',render);
$('#reset-filters').addEventListener('click',()=>{$('#course-search').value='';$('#course-level').value='all';$('#course-format').value='all';render();$('#course-search').focus();});
$('#empty-reset').addEventListener('click',()=>{$('#course-search').value='';$('#course-level').value='all';$('#course-format').value='all';selectTab(tabs[0]);tabs[0].focus();});
function toggleSaved(id){saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('HandesTECH-saved-courses',JSON.stringify([...saved]));}catch{storageAvailable=false;}render();if(activeCourse){const b=$('#dialog-save');b.setAttribute('aria-pressed',String(saved.has(activeCourse.id)));b.textContent=saved.has(activeCourse.id)?'♥ Saved':'♡ Save course';}$('#save-status').textContent=(saved.has(id)?'Course saved':'Course removed')+(storageAvailable?'':' — for this visit only');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#save-status').textContent='',3000);}
function openCourse(id,trigger){const c=courses.find(c=>c.id===id);if(!c)return;activeCourse=c;opener=trigger;const e=escapeHTML;const mail='mailto:?subject='+encodeURIComponent('Course enquiry — '+c.title)+'&body='+encodeURIComponent('Hello HandesTECH,\nI am interested in '+c.title+'. Please share availability, duration, fees and prerequisites.\n\nMy experience: \nMy learning goal: ');
$('#dialog-content').innerHTML=`<div class="detail-hero"><img src="assets/${c.photo}.jpg" alt="Subject photograph for ${e(c.title)}"><div class="detail-heading"><p class="eyebrow">${e(c.category)} · ${e(c.level)}</p><h2 id="detail-title">${e(c.title)}</h2><p>${e(c.description)}</p></div></div><div class="detail-content"><div class="detail-tabs" role="tablist" aria-label="Course information"><button id="detail-overview-tab" role="tab" aria-controls="detail-overview" aria-selected="true" data-detail="overview">Overview</button><button id="detail-syllabus-tab" role="tab" aria-controls="detail-syllabus" aria-selected="false" tabindex="-1" data-detail="syllabus">Syllabus</button></div><div id="detail-overview" role="tabpanel" aria-labelledby="detail-overview-tab"><h3>What you’ll work towards</h3><p>${e(c.outcome)}</p><h3>Learning formats</h3><p>Enquire about recorded access, live group training or a tailored VIP session. Dates, recording availability and fees are confirmed individually.</p><h3>Before you start</h3><p>${e(c.prerequisite)}.</p></div><div id="detail-syllabus" role="tabpanel" aria-labelledby="detail-syllabus-tab" hidden><ol>${c.topics.map(t=>'<li>'+e(t)+'</li>').join('')}</ol><p>Scope can be tailored to your project goals. Confirm the final outline when enquiring.</p></div><div class="detail-actions"><a class="button" href="${e(mail)}">Enquire about this course ↗</a><button class="button secondary" id="dialog-save" aria-pressed="${saved.has(id)}">${saved.has(id)?'♥ Saved':'♡ Save course'}</button></div></div>`;
const detailTabs=[...document.querySelectorAll('[data-detail]')];wireTabs(detailTabs,t=>{detailTabs.forEach(b=>{const active=b===t;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('#detail-'+b.dataset.detail).hidden=!active;});});$('#dialog-save').addEventListener('click',()=>toggleSaved(id));$('#course-dialog').showModal();document.body.style.overflow='hidden';$('.dialog-close').focus();}
document.addEventListener('click',e=>{const open=e.target.closest('[data-open]');const save=e.target.closest('[data-save]');if(open)openCourse(open.dataset.open,open);if(save){const id=save.dataset.save;toggleSaved(id);const next=document.querySelector(`[data-save="${id}"]`);(next||tabs.find(t=>t.dataset.tab===category)).focus();}});
$('.dialog-close').addEventListener('click',()=>$('#course-dialog').close());$('#course-dialog').addEventListener('click',e=>{if(e.target===$('#course-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});$('#course-dialog').addEventListener('close',()=>{document.body.style.overflow='';activeCourse=null;const target=opener?.dataset.open?document.querySelector(`[data-open="${opener.dataset.open}"]`):null;(target||tabs.find(t=>t.dataset.tab===category)).focus();});
const menu=$('.menu-toggle'),nav=$('#main-nav');function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});render();

