const express = require('express')
const route = require('./class.routes')
const logger = require('../packages/logger')

const app = express();

app.use(express.json())

app.get('/health', async (req, res) => {
    res.json({status:"ok", service:'org-service'})
})

app.use('/class', route)

app.use((err, req, res, next)=>{
    logger.error('class-service', err.message)
    res.status(err.status || 500).json({error: err.message})
})



const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    logger.info('class-service', `Running on port ${PORT}`)
})