const express = require('express');
const PostModel = require('./schema');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');
const schedule = require('node-schedule');
const { isUser } = require('../../utilities/middlewares');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer();

const router = express.Router();

// schedule.scheduleJob('* * * * *', async function () {
//   await PostModel.collection.deleteMany({});
//   console.log('U FSHIN');
// });

router.get('/', isUser, async (req, res, next) => {
  try {
    const posts = await PostModel.find({}).populate('user');
    res.send(posts);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/', isUser, async (req, res, next) => {
  try {
    const { text } = req.body;
    const newPost = new PostModel({ text, user: req.user._id });
    const { _id } = await newPost.save();

    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  '/me/:postId',
  upload.single('post'),
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
                await PostModel.findByIdAndUpdate(req.params.postId, {
                  image: result.secure_url,
                });

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

router.delete('/:postId', isUser, async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.postId);
    if (post) {
      await PostModel.findByIdAndDelete(req.params.postId);
      res.status(200).send('OK');
    } else {
      const err = new Error('Post does not exists!');
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
