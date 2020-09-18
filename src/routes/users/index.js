const express = require('express');
const router = express.Router();
const UserModel = require('./schema');
const { generateToken } = require('../../utilities/Authorization/jwtFunctions');
const { isUser, isAdmin } = require('../../utilities/middlewares');
const multer = require('multer');

const MulterAzureStorage = require('multer-azure-storage');
const uploadPhotos = multer({
  storage: new MulterAzureStorage({
    azureStorageConnectionString: process.env.PHOTOS_CONNECTION_STRING,
    containerName: 'photos',
    containerSecurity: 'blob',
  }),
});

// logged-in user routes
router.get('/me', isUser, async (req, res, next) => {
  try {
    res.status(200).send(req.user);
  } catch (error) {
    next(error);
  }
});

router.put('/me', isUser, async (req, res, next) => {
  try {
    delete req.body.username;
    delete req.body.email;

    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save({ validateBeforeSave: false });
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

router.delete('/me', isUser, async (req, res, next) => {
  try {
    await req.user.remove();

    res.send('Deleted');
  } catch (error) {
    next(error);
  }
});

router.delete('/me/photo', isUser, async (req, res) => {
  const imageUrl = req.user.image;
  const imageUrlParts = imageUrl.split('/');
  const imageName = imageUrlParts[imageUrlParts.length - 1];

  const container = await blobClient.getContainerClient('photos');
  await container.deleteBlob(imageName);

  res.send('DELETED');
});

// Admin routes

router.get('/:username', isUser, isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ username: req.params.username });
    if (user) res.status(200).send(user);
    else res.status(404).send('Not Found!');
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put('/:username', isUser, isAdmin, async (req, res, next) => {
  try {
    delete req.body.username;
    delete req.body.email;

    const user = await UserModel.findOne({ username: req.params.username });
    if (user) {
      const updates = Object.keys(req.body);
      updates.forEach((update) => (user[update] = req.body[update]));

      await user.save({ validateBeforeSave: false });
      res.status(200).send(user);
    } else res.status(404).send('Not Found!');
  } catch (error) {
    next(error);
  }
});

router.delete('/:username', isUser, isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ username: req.params.username });

    if (user) {
      await user.remove();
      res.status(200).send('Deleted!');
    } else res.status(404).send('Not Found!');

    res.send('Deleted');
  } catch (error) {
    next(error);
  }
});

// Azure storage for photos with MulterAzureStorage
router.post(
  '/me/upload',
  isUser,
  uploadPhotos.single('file'),
  async (req, res) => {
    // res.send(req.file.url);
    try {
      req.user.image = req.file.url;
      await req.user.save({ validateBeforeSave: false });
      res.status(200).send('OK');
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

// login/logout, register routes
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
      err.message = 'Check your username/passord!';
      next(err);
    }
  } catch (e) {}
});

router.post('/logout', isUser, async (req, res, next) => {
  try {
    req.user.token = '';
    await req.user.save({ validateBeforeSave: false });

    res.redirect('/');
  } catch (error) {
    next(error);
  }
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
