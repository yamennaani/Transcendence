const { timeStamp, info, warn } = require("node:console")
const { json } = require("node:stream/consumers")

const log = (level, service, message, data = {}) =>{
    console.log(JSON.stringify({
        level,
        service,
        message,
        data,
        timeStamp: new Date().toISOString()
    }))
}

module.exports = {
    info: (service, mgs, data) => log('info', service, mgs, data),
    error: (service, msg, data) => log('error', service, msg, data),
    warn: (service, ms, data) => log('warn', service, msg, data),
}