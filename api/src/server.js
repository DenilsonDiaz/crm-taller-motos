import { createPool } from './db.js';
import { createApp } from './app.js';
const pool=createPool();
const app=createApp(pool);
const port=Number(process.env.PORT||3000);
const server=app.listen(port,'127.0.0.1',()=>console.log(`MotoGest API: http://localhost:${port}/api`));
process.on('SIGINT',async()=>{server.close();await pool.end();process.exit(0);});
