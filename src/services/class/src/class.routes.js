const express = require('express')
const classService = require('./class.service')
const route = express.Router()

route.get('/', async (req, res, next)=>{
    try {
        res.json( await classService.getClasses())
    } catch (error) {next(error)}
})

route.get('/:id', async (req, res, next)=>{
    try{
        res.json( await classService.getClass(req.params.id))
    }catch(err){next(err)}
})

route.post('/:id/assignments', async(req, res, next)=>{
    try{
        res.json( await classService.createAssignment(req.params.id, req.body))
    }catch(err){next(err)}
})

route.get('/:id/assignments', async (req, res, next)=>{
    try{
        res.json(await classService.getAssignments(req.params.id))
    }catch(err){next(err)}
})

route.post('/', async (req, res, next)=>{
    try {
        res.json( await classService.createClass(req.body))
    } catch (error) {next(error)}
})



module.exports = route