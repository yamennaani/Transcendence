const log = (level, service, message, data = {}) => {
  console.log(JSON.stringify({
    level,
    service,
    message,
    data,
    timestamp: new Date().toISOString()
  }))
}

module.exports = {
  info:  (service, msg, data) => log('info',  service, msg, data),
  error: (service, msg, data) => log('error', service, msg, data),
  warn:  (service, msg, data) => log('warn',  service, msg, data),
}