const express = require('express')
const router = express.Router()
const subService = require('./submission.service')
const upload = require('./upload.middleware')


router.post('/', async (req, res, next)=>{
    try{
        res.json(await subService.createSubmission(req.body))
    }catch(err){next(err)}
})

router.patch('/:groupId/close' , async (req, res, next)=>{
    try{
        res.json(await subService.closeSubmission(req.params.groupId, req.body))
    }catch(err){ next(err)}
})

router.get('/assignment/:assId/', async (req, res, next)=>{
    try{
        res.json(await subService.getSubmissionsForAssignment(req.params.assId))
    }catch(err){next(err)}
})


router.post('/:groupId/file', upload.single('file'), async (req, res, next) => {
  try {
    const { userId } = req.body
    res.json(await subService.uploadFile(req.params.groupId, userId, req.file))
  } catch (err) { next(err) }
})


router.get('/:groupId/file/download', async (req, res, next) => {
  try {
    const { userId } = req.query
    res.json(await subService.getDownloadUrl(req.params.groupId, userId))
  } catch (err) { next(err) }
})


router.delete('/:groupId/file', async (req, res, next) => {
  try {
    res.json(await subService.removeFile(req.params.groupId, req.body.userId))
  } catch (err) { next(err) }
})

router.get('/:groupId', async (req, res, next)=>{
    try{
        res.json(await subService.getGroupSubmissions(req.params.groupId))
    }catch(err){next(err)}
})

module.exports = router