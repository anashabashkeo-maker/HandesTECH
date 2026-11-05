window.HandesAcademyRuntime={ready:fetch('assets/academy-config.json?v=19',{cache:'no-store'}).then(r=>r.ok?r.json():({enabled:false})).catch(()=>({enabled:false}))};
