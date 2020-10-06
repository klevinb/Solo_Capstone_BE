const { jwtVerifier } = require('./Authorization/jwtFunctions');
const ProfileModel = require('../routes/users/schema');

const isUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const credentials = await jwtVerifier(token);

      if (!credentials) {
        const err = new Error('Please authenticate yourself!');
        err.httpStatusCode = 401;
        next(err);
      } else {
        const user = await ProfileModel.findOne({
          _id: credentials._id,
        })
          .populate('events')
          .populate('following', ['name', 'surname', 'image', 'username']);

        if (user) {
          req.user = user;
          next();
        } else {
          res.status(404).send('Check your username/passord');
        }
      }
    } else {
      const err = new Error('Token missing!');
      err.httpStatusCode = 400;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role.toString() === 'admin') next();
  else {
    const err = new Error();
    err.httpStatusCode = 401;
    err.message = 'Only Admin can access this endpoint!';
    next(err);
  }
};

module.exports = {
  isUser,
  isAdmin,
};
