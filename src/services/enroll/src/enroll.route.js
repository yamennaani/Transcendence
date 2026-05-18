const express = require('express')
const enrollService = require('./enroll.service')
const route = express.Router()

route.post('/',async (req, res, next)=>{
    try{
        const result = await enrollService.enrollStudent(req.body)
        res.status(201).json(result)
    }catch(err){next(err)}
})

route.patch('/', async(req, res, next)=>{
    try{
        const result = await enrollService.dropStudent(req.body)
        res.json(result)
    }catch(err){next(err)}
})

route.get('/:id', async(req, res, next)=>{
    try{
        res.json(await enrollService.getEnrollement(req.params.id))
    }catch(error){next(error)}
})

route.get('/classes/:id', async(req, res, next)=>{
    try{
        await res.json(await enrollService.getEnrolledClasses(req.params.id))
    }catch(err){next(err)}
})

module.exports = route