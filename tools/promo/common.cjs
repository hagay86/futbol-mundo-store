exports.setup=async(pg,ext)=>{ pg.on('requestfailed',r=>ext.add(r.url())); };
