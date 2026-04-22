const express = require('express')
const route = express.Router()
const groupService = require('./group.service')

route.post('/', async (req, res, next)=>{
    try{
        res.json(await groupService.createGroup(req.body))
    }catch(err){next(err)}
})

route.post('/:id/invite', async (req, res, next)=>{
    try{
        res.json(await groupService.inviteMember(req.params.id, req.body))
    }catch(err){next(err)}
})

route.patch('/invite/:id', async(req, res, next)=>{
    try{
        res.json(await groupService.respondToInvite(req.params.id,req.body))
    }catch(err){next(err)}
})

module.exports = route