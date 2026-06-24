const express = require('express')
const route = require('./eval.route')
const logger = require('../packages/logger')

const app = express()
app.use(express.json())
app.get('/health', async (req, res, next)=>{
    res.json({status: 'ok', service:'eval-service'})
})

app.use('/eval', route)

app.use((err, req, res, next)=>{
    logger.error('eval-service', err.message)
    res.status(200).json({ ok: false, error: err.message, code: err.status || 500 })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    logger.info('eval-service', `Running on Port ${PORT}`)
})