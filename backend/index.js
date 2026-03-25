const express = require('express');
const {Pool} = require('pg');
const app = express();
const port = process.env.PORT;

app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_NAME,
    password: process.env.DB_PASS
});

app.get('/api/', (req, res)=>
{
    res.send('hello world');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, ()=>
{
    console.log(`server running at http://localhost:${port}`);
});