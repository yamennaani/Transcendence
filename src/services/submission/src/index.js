const express = require('express')
const logger = require('../packages/logger')

const route = require('./submission.routes')
const { storageReady } = require('./submission.service')

const app = express()
app.use(express.json())

app.get('/health', (req, res)=>{
    res.json({message: "submission-service is running"})
})

app.use('/submission', route)

app.use((err, req, res, next)=>{
    logger.error('submission-service',err.message)
    res.status(200).json({ ok: false, error: err.message, code: err.status || 500 })
})

const PORT = process.env.PORT || 3000

const start = async () => {
    await storageReady
    app.listen(PORT, ()=>{
        logger.info('submission-service', `running on Port ${PORT}`)
    })
}

start().catch(err => {
    logger.error('submission-service', 'Failed to start submission service', err)
    process.exit(1)
})
