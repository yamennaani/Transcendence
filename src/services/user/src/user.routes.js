const express = require('express')
const { getAllUsers, getUserById, createUser } = require('./user.service')

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

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await createUser(req.body))
  } catch (err) { next(err) }
})

module.exports = router