const express = require('express')
const logger = require('../packages/logger')
const userRoutes = require('./user.routes')

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' })
})

app.use('/user', userRoutes)

const isProd = process.env.NODE_ENV === 'production'

app.use((err, req, res, next) => {
  const status = err.status || 500

  logger.error('user-service', err.message, { status, stack: err.stack })

  const message = !isProd || status < 500 ? err.message : 'Something went wrong!'
  res.status(status).json({ error: message })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info('user-service', `Running on port ${PORT}`)
})