const express = require('express')
const orgService = require('./org.service')

const router = express.Router()

router.get('/', async (req, res, next)=>{
    try{
        res.json(await orgService.getAllOrgs())
    }catch(err) { next(err) }
})

router.get('/:id', async(req, res, next)=>{
    try{
        res.json(await orgService.getOrg(req.params.id))
    }catch(err) { next(err) }
})

router.post('/', async (req, res, next)=>{
    try {
        res.json(await orgService.createOrg(req.body))
    } catch (err) { next(err) }
})

router.post('/:id/members', async (req, res, next)=>{
    try{
        res.json( await orgService.createMember(req.params.id, req.body))
    }catch(err) { next(err) }
})

router.delete('/:id/members', async (req, res, next)=>{
    try{
        res.json(await orgService.removeMember(req.params.id, req.body))
    }catch(err){ next(err)}
})

module.exports = router