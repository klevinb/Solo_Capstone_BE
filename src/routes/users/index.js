const express = require('express');
const router = express.Router();
const UserModel = require('./schema');
const EventModel = require('../events/schema');
const { generateToken } = require('../../utilities/Authorization/jwtFunctions');
const { isUser, isAdmin } = require('../../utilities/middlewares');
const schedule = require('node-schedule');
const {
  generatePdfWithPhoto,
  generatePdf,
} = require('../../utilities/pdfGenerator');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs-extra');
const passport = require('passport');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

schedule.scheduleJob('* */24 * * *', async function () {
  await UserModel.collection.updateMany({}, { $set: { stories: [] } });
});

// logged-in user routes
router.get('/', isUser, async (req, res, next) => {
  try {
    const users = await UserModel.find({});
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

router.post(
  '/me/story',
  upload.single('story'),
  isUser,
  async (req, res, next) => {
    try {
      try {
        if (req.file) {
          const cld_upload_stream = cloudinary.uploader.upload_stream(
            {
              folder: 'stories',
            },
            async (err, result) => {
              if (!err) {
                req.user.stories.push(result.secure_url);
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
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

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
    const user = await UserModel.findOne({
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

// login/logout, register routes
router.post('/login', async (req, res, next) => {
  try {
    const { credentials, password } = req.body;

    const user = await UserModel.findByCredentials(credentials, password);

    if (user) {
      const token = await generateToken(user);
      res.cookie('token', token.token, {
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

router.post('/:eventId/pdf', isUser, async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.eventId);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    if (event) {
      if (event.image.length) {
        const imageUrl = event.image[0];
        const document = await generatePdfWithPhoto(imageUrl, req.body.email);

        const sendEmail = async () => {
          fs.readFile(document, function (err, data) {
            let data_base64 = data.toString('base64');
            sgMail.send({
              to: `${req.body.email}`,
              from: 'events@yolo.com',
              subject: 'Event Details',
              text: `${req.user.name} thanks for booking our event! Below you will find informations about the event.`,
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
        res.status(201).send('Sent');
      } else {
        const document = await generatePdf(req.body.email);
        console.log(document);

        const sendEmail = async () => {
          fs.readFile(document, function (err, data) {
            let data_base64 = data.toString('base64');
            sgMail.send({
              to: `${req.body.email}`,
              from: 'events@yolo.com',
              subject: 'Event Details',
              text: `${req.user.name} thanks for booking our event! Below you will find more informations.`,
              attachments: [
                {
                  filename: `EventDetails.pdf`,
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
        res.status(201).send('Sent');
      }
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

module.exports = router;
