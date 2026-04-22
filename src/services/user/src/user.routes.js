const express = require('express')
const { getAllUsers, getUserById, createUser, getProfile, updateProfile, deleteUser } = require('./user.service')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await getAllUsers())
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getUserById(req.params.id))
  } catch (err) { next(err) }
})

router.post('/register', async (req, res, next) => {
  try {
    res.status(201).json(await createUser(req.body))
  } catch (err) { next(err) }
})

router.get('/:id/profile', async (req, res, next)=>{
  try {
    res.json(await getProfile(req.params.id))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/profile', async (req, res, next)=>{
  try{
    res.json(await updateProfile(req.params.id, req.body.bio));
  }catch(err){
    next(err)
  }
})

router.delete('/:id', async(req, res, next)=>{
  try{
    res.json(await deleteUser(req.params.id))
  }catch(err){
    next(err)
  }
})

module.exports = router