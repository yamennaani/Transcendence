const express = require('express')
const route = express.Router()
const groupService = require('./group.service')

route.post('/', async (req, res, next)=>{
    try{
        res.json(await groupService.createGroup(req.body))
    }catch(err){next(err)}
})

// Specific routes MUST come before parameterised /:id routes

// Get current user's group for a specific assignment
route.get('/my-group', async(req, res, next)=>{
    try{
        res.json(await groupService.getMyGroupForAssignment(req.query))
    }catch(err){next(err)}
})

// List all groups for an assignment (staff management)
route.get('/assignment/:assId', async(req, res, next)=>{
    try{
        res.json(await groupService.getGroupsForAssignment(req.params.assId))
    }catch(err){next(err)}
})

//Show list of pending invites
route.get('/invite', async(req, res, next)=>{
    try{
        res.json(await groupService.getInvites(req.query))
    }catch(err){next(err)}
})

//delete pending invite
route.delete('/invite/:id', async(req, res, next)=>{
    try{
        res.json(await groupService.deleteInvite(req.params.id))
    }catch(err){next(err)}
})

route.patch('/invite/:id', async(req, res, next)=>{
    try{
        res.json(await groupService.respondToInvite(req.params.id,req.body))
    }catch(err){next(err)}
})

// staff/admin: directly add a member to a group
route.post('/:id/admin/member', async (req, res, next) => {
    try {
        res.json(await groupService.addMemberAdmin(req.params.id, req.body))
    } catch (err) { next(err) }
})

route.post('/:id/invite', async (req, res, next)=>{
    try{
        res.json(await groupService.inviteMember(req.params.id, req.body))
    }catch(err){next(err)}
})

//leave group
route.delete('/:id', async (req, res, next)=>{
    try{
        res.json(await groupService.leaveGroup(req.params.id, req.body))
    }catch(err){next(err)}
})

//staff/admin: force-remove a group entirely
route.delete('/:id/admin', async (req, res, next)=>{
    try{
        res.json(await groupService.deleteGroup(req.params.id))
    }catch(err){next(err)}
})

//get group profile
route.get('/:id', async (req, res, next)=>{
    try{
        res.json(await groupService.getGroup(req.params.id))
    }catch(err){next(err)}
})

module.exports = route