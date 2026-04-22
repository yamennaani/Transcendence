const express = require('express')
const logger = require('../packages/logger')
const route = require('./group.route')

const app = express()

app.use(express.json())

app.get('/health', (req, res, next)=>{
    res.json({'status':'ok', 'message':'group-service healthy'})
})

app.use('/group', route)

app.use((err, req, res, next)=>{
    logger.error('group-service', err.message)
    res.status(err.status || 500).json({error: err.message})
})


const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
    logger.info('group-service', `Server is Running on Port ${PORT}`)
})