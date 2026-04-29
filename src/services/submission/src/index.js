const express = require('express')
const logger = require('../packages/logger')

const route = require('./submission.routes')

const app = express()
app.use(express.json())

app.get('/health', (req, res)=>{
    res.json({message: "submission-service is running"})
})

app.use('/submission', route)

app.use((err, req, res, next)=>{
    logger.error('org-service',err.message)
    res.status(err.status || 500).json({error: err.message})
})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
    logger.info('submission-service', `running on Port ${PORT}`)
})
