const express = require('express')
const logger = require('../packages/logger')
const userRoutes = require('./user.routes')

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' })
})

app.use('/user', userRoutes)

app.use((err, req, res, next) => {
  logger.error('user-service', err.message)
  res.status(err.status || 500).json({ error: err.message })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info('user-service', `Running on port ${PORT}`)
})