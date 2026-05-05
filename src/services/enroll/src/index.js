const express = require('express')
const route = require('./enroll.route')
const logger = require('../packages/logger')

const app = express()
app.use(express.json())
app.get('/health', async (req, res, next)=>{
    res.json({status: 'ok', service:'enroll-service'})
})

app.use('/enroll', route)

app.use((err, req, res, next)=>{
    logger.error('enroll-service', err.message)
    res.status(err.status || 500).json({error: err.message})
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    logger.info('enroll-service', `Running on Port ${PORT}`)
})