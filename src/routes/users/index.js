const express = require('express');
const UserModel = require('./schema');

const router = express.Router();

router.get('/', async (req, res, next) => {
  console.log('HERE');
});

router.post('/register', async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const {_id} = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
