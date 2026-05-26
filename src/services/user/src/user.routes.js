const express = require('express')
const userService = require('./user.service')

const router = express.Router()
const {uploader} = require('../packages/fileManager')

router.post('/:id/avatar', uploader.single('avatar'), async (req, res, next) => {
  try {
    res.json(await userService.uploadAvatar(req.params.id, req.file))
  } catch (err) { next(err) }
})


router.get('/', async (req, res, next) => {
  try {
    res.json(await userService.getAllUsers())
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await userService.getUserById(req.params.id))
  } catch (err) { next(err) }
})

//Havent tested it yet
router.get('/:id/role', async (req, res, next) => {
  try {
    res.json(await userService.getRole(req.params.id))
  } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
  try {
    res.json(await userService.loginUser(req.body))
  } catch (err) { next(err) }
})


router.post('/register', async (req, res, next) => {
  try {
    res.status(201).json(await userService.createUser(req.body))
  } catch (err) { next(err) }
})

router.get('/:id/profile', async (req, res, next)=>{
  try {
    res.json(await userService.getProfile(req.params.id))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/profile', async (req, res, next)=>{
  try{
    res.json(await userService.updateProfile(req.params.id, req.body.bio));
  }catch(err){
    next(err)
  }
})

router.delete('/:id', async(req, res, next)=>{
  try{
    res.json(await userService.deleteUser(req.params.id))
  }catch(err){
    next(err)
  }
})

module.exports = router