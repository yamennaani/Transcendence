const express = require('express');
const logger = require('../packages/logger')
const orgRouter = require('./org.routes')

const app = express()
app.use(express.json())

app.get('/health', (req, res)=>{
    res.json({status: "ok", service: 'org-service'})
})

app.use('/org', orgRouter)

app.use((err, req, res, next)=>{
    logger.error('org-service',err.message)
    res.status(err.status || 500).json({error: err.message})
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    logger.info('org-service', `Running on Port ${PORT}`)
})

