const express = require('express');
const router = express.Router();
const ProfileModel = require('./schema');
const EventModel = require('../events/schema');
const {
  generateTokens,
  refreshToken,
} = require('../../utilities/Authorization/jwtFunctions');
const { isUser, isAdmin } = require('../../utilities/middlewares');
const { generatePdf } = require('../../utilities/pdfGenerator');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs-extra');
const passport = require('passport');
const axios = require('axios');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

// logged-in user routes
router.get('/', isUser, async (req, res, next) => {
  try {
    const users = await ProfileModel.find({});
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
});
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

    const newEdit = await req.user.save({ validateBeforeSave: false });
    res.send(newEdit);
  } catch (error) {
    next(error);
  }
});

router.post('/me/oldPassword', isUser, async (req, res, next) => {
  try {
    const oldPassword = req.body.password;
    const user = await ProfileModel.findByCredentials(
      req.user.username,
      oldPassword
    );
    if (!user) {
      res.status(404).send('Password is not the same!');
    } else {
      res.sendStatus(200);
    }
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

router.post('/:loggedInUser/followBack/:username', async (req, res, next) => {
  try {
    const user = await ProfileModel.followToggle(
      req.params.loggedInUser,
      req.params.username
    );
    if (user) {
      res.status(200).json('Followed');
    } else {
      res.status(200).json('Unfollowed');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/:loggedInUser/follow/:username', async (req, res, next) => {
  try {
    const user = await ProfileModel.followToggle(
      req.params.loggedInUser,
      req.params.username
    );
    await axios.post(
      process.env.BACKEND_URL +
        '/api/users/' +
        req.params.username +
        '/followBack/' +
        req.params.loggedInUser
    );
    if (user) {
      res.status(200).json('Followed');
    } else {
      res.status(200).json('Unfollowed');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Azure storage for photos with MulterAzureStorage

router.post(
  '/me/upload',
  upload.single('profile'),
  isUser,
  async (req, res, next) => {
    try {
      if (req.file) {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: 'profiles',
          },
          async (err, result) => {
            if (!err) {
              req.user.image = result.secure_url;
              await req.user.save({ validateBeforeSave: false });

              res.status(200).send('Done');
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
      } else {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = 'Image file missing!';
        next(err);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Admin routes

router.get('/:username', isUser, isAdmin, async (req, res, next) => {
  try {
    const user = await ProfileModel.findOne({
      username: req.params.username,
    }).populate('followers');
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

    const user = await ProfileModel.findOne({ username: req.params.username });
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
    const user = await ProfileModel.findOne({ username: req.params.username });

    if (user) {
      await user.remove();
      res.status(200).send('Deleted!');
    } else res.status(404).send('Not Found!');

    res.send('Deleted');
  } catch (error) {
    next(error);
  }
});

// login/logout, register routes
router.post('/login', async (req, res, next) => {
  try {
    const { credentials, password } = req.body;

    const user = await ProfileModel.findByCredentials(credentials, password);

    if (user) {
      const tokens = await generateTokens(user);
      res.cookie('token', tokens.token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
      res.sendStatus(200);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      err.message = 'Check your username/passord!';
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/logout', isUser, async (req, res, next) => {
  try {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (token) => token.token !== req.cookies.refreshToken
    );

    await req.user.save({ validateBeforeSave: false });

    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const newUser = new ProfileModel(req.body);
    const user = await newUser.save();

    res.status(201).send(user._id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/refreshTokens', async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    const err = new Error('Forbidden');
    err.httpStatusCode = 403;
    next(err);
  } else {
    try {
      const tokens = await refreshToken(oldRefreshToken);
      res.cookie('token', tokens.token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 401;
      next(err);
    }
  }
});

// oAuth
router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/auth/facebook/redirect',
  passport.authenticate('facebook'),
  async (req, res, next) => {
    try {
      const token = req.user.token;
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });

      res.writeHead(301, {
        Location: process.env.FRONTEND_URL + '/dashbord',
      });
      res.end();
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

// routes with Sendgrid to send user email with notifications

router.post('/:eventId/pdf/:userId', async (req, res, next) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const event = await EventModel.findById(req.params.eventId);
    const user = await ProfileModel.findById(req.params.userId);

    console.log(user.email);

    if (event) {
      const imageUrl = event.image[0];
      const document = await generatePdf(imageUrl, req.body.email, event);

      const sendEmail = async () => {
        fs.readFile(document, function (err, data) {
          let data_base64 = data.toString('base64');
          sgMail.send({
            to: `${user.email}`,
            from: 'events@yolo.com',
            subject: 'Event Details',
            text: `${user.name} thanks for booking our event! Below you will find informations about the event.`,
            attachments: [
              {
                filename: `EvenetDetails.pdf`,
                content: data_base64,
                type: 'application/pdf',
                disposition: 'attachment',
              },
            ],
          });
        });
        fs.unlink(document);
      };
      setTimeout(sendEmail, 1000);
      res.redirect(process.env.FRONTEND_URL + '/profile');
    } else {
      const err = new Error('There is no event with that ID!');
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/send/question', async (req, res, next) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.send({
      to: `${req.body.email}`,
      from: 'support@yolo.com',
      subject: 'Questions Team',
      text: `${req.body.name} thanks for contacting us. We will send you an answer ASAP! YOLO TEAM`,
    });

    res.status(201).send('Sent');
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
