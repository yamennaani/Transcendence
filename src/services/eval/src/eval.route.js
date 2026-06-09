const express = require('express')
const route = express.Router()
const service = require('./eval.service')

route.get('/sheet/:id', async(req, res, next)=>{
    try{
        res.json(await service.getEvalSheetById(req.params.id))
    }catch(err){next(err)}
})

route.get('/sheet/ass/:id', async(req, res, next)=>{
        try{
        res.json(await service.getEvalSheetByAssId(req.params.id))
    }catch(err){next(err)}
})

route.post('/sheet', async (req, res, next)=>{
    try{
        res.json(await service.createEvalSheet(req.body))
    }catch(err){next(err)}
})

route.post('/sheet/:id/section', async (req, res, next)=>{
    try {
        res.json(await service.createEvalSection(req.params.id, req.body))
    } catch (err) {next(err)}
})

route.patch('/sheet/:id/section', async(req, res, next)=>{
    try{
        res.json(await service.updateEvalSheetSection(req.params.id, req.body))
    }catch(err){ next(err)}
})


route.delete('/sheet/:id/section', async(req, res, next)=>{
    console.log(req.body)
    try{
        res.json(await service.removeSection(req.params.id, req.body))
    }catch(err){next(err)}
})

// TODO also move it.
route.get('/assignment/:id', async(req, res, next)=>{
    try{
        res.json(await service.getAssignment(req.params.id))
    }catch(err){ next(err)}
})


// Routes pertaining to EvalAssignment model/table

// creates one EvalAssignment manually (POST /api/eval/eval-assignments) 
route.post('/eval-assignments', async(req, res, next) => {
    try{
        res.json(await service.createEvalAssignment(req.body))
    }catch(err){next(err)}
})

// get all EvalAssignments for one assignment (GET /api/eval/assignment/:id/eval-assignments)
route.get('/assignment/:id/eval-assignments', async (req, res, next) => {
  try {
    res.json(await service.getEvalAssignments(req.params.id))
  } catch (err) {
    next(err)
  }
})

// get one EvalAssignment by its EvalAssignment-id (GET /api/eval/eval-assignments/:id)
route.get('/eval-assignments/:id', async (req, res, next) => {
  try {
    res.json(await service.getEvalAssignmentById(req.params.id))
  } catch (err) {
    next(err)
  }
})

// update one EvalAssignment (PUT /api/eval/eval-assignments/:id)
route.put('/eval-assignments/:id', async(req, res, next) => {
    try{
        res.json(await service.updateEvalAssignment(req.params.id, req.body))
    }catch(err){next(err)}
})

// delete one EvalAssignment (DELETE /api/eval/eval-assignments/:id)
route.delete('/eval-assignments/:id', async(req, res, next) => {
    try{
        res.json(await service.deleteEvalAssignment(req.params.id))
    }catch(err){next(err)}
})

route.post('/assignment/:id/generate-simple-pairings', async(req, res, next) => {
    try{
        res.json(await service.generateSimpleEvalAssignmentPairings(req.params.id))
    }catch(err){next(err)}
})


module.exports = route