const express = require('express');
const UserModel = require('./schema');
const { generateToken } = require('../../utilities/Authorization/jwtFunctions');

const router = express.Router();

router.get('/', async (req, res, next) => {
  console.log('HERE');
});

router.post('/login', async (req, res, next) => {
  try {
    const { credentials, password } = req.body;

    const user = await UserModel.findByCredentials(credentials, password);

    if (user) {
      const token = await generateToken(user);
      res.send(token);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      err.message = 'User not found!';
      next(err);
    }
  } catch (e) {}
});

router.post('/register', async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
