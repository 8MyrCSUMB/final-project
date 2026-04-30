import fs from 'fs';
import mysql from 'mysql2/promise';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => { 
  if(line && line.includes('=')) { 
    const [k, v] = line.split('='); 
    acc[k.trim()] = v.trim(); 
  } 
  return acc; 
}, {});

async function main() {
  const pool = mysql.createPool({host: env.DB_HOST, user: env.DB_USER, password: env.DB_PASSWD, database: env.DB_DATABASE});
  try {
    const [rows] = await pool.query('SELECT * FROM likedMusic');
    console.log("likedMusic rows:", rows);
    const [schema] = await pool.query('DESCRIBE likedMusic');
    console.log("likedMusic schema:", schema);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
main();
