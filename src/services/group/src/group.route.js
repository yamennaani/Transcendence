const express = require('express')
const route = express.Router()
const groupService = require('./group.service')

route.post('/', async (req, res, next)=>{
    try{
        res.json(await groupService.createGroup(req.body))
    }catch(err){next(err)}
})

//leaving group, get group/profile, delete pending invite, show list of pending invites

//leave group
route.delete('/:id', async (req, res, next)=>{
    try{
        res.json(await groupService.leaveGroup(req.params.id, req.body))
    }catch(err){next(err)}
})

//get group profile
route.get('/:id', async (req, res, next)=>{
    try{
        res.json(await groupService.getGroup(req.params.id))
    }catch(err){next(err)}
})

//delete pending invite
route.delete('/invite/:id', async(req, res, next)=>{
    try{
        res.json(await groupService.deleteInvite(req.params.id))
    }catch(err){next(err)}
})

//Show list of pending invites
route.get('/invite', async(req, res, next)=>{
    try{
        res.json(await groupService.getInvites(req.query))
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