
const express = require('express');
const logger = require('../packages/logger')
const app = express();

app.use(express.json())

app.get('/example/', (req, res)=>{
    res.json({status: 'ok', service: "example"});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    logger.info('auth service', `running on Port ${PORT}`);
})