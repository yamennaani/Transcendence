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
        res.json( await classService.getClassById(req.params.id))
    }catch(err){next(err)}
})

route.get('/courses/:id', async (req, res, next)=>{
    try{
        res.json( await classService.getClassByOrgId(req.params.id))
    }catch(err){next(err)}
})

route.post('/', async (req, res, next)=>{
    try {
        res.json( await classService.createClass(req.body))
    } catch (error) {next(error)}
})

route.put('/:id', async (req, res, next)=>{
    try {
        res.json( await classService.updateClass(req.params.id, req.body))
    } catch (error) {next(error)}
})

route.delete('/:id', async (req, res, next)=>{
    try {
        res.json( await classService.deleteClass(req.params.id))
    } catch (error) {next(error)}
})

route.post('/:id/assignment', async(req, res, next)=>{
    try{
        res.json( await classService.createAssignment(req.params.id, req.body)) // id passed = course id
    }catch(err){next(err)}
})

route.get('/:id/assignments', async (req, res, next)=>{
    try{
        res.json(await classService.getAssignments(req.params.id)) // id passed = course id 
    }catch(err){next(err)}
})

route.get('/assignment/:id', async (req, res, next)=>{
    try{
        res.json(await classService.getAssignmentById(req.params.id)) // id passed = assignment id
    }catch(err){next(err)}
})

route.put('/assignment/:id', async (req, res, next)=>{
    try{
        res.json(await classService.updateAssignment(req.params.id, req.body)) // id passed = assignment id
    }catch(err){next(err)}
})

route.delete('/assignment/:id', async (req, res, next)=>{
    try{
        res.json(await classService.deleteAssignment(req.params.id)) // id passed = assignment id
    }catch(err){next(err)}
})


module.exports = route