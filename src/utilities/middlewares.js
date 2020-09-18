const { jwtVerifier } = require('./Authorization/jwtFunctions');
const ProfileModel = require('../routes/users/schema');

const isUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const credentials = await jwtVerifier(token);

      const user = await ProfileModel.findById(credentials._id);

      if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).send('Check your username/passord');
      }
    } else {
      const err = new Error();
      err.httpStatusCode = 400;
      err.message = 'Token missing!';
      next(err);
    }
  } catch (error) {
    console.log(error);
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
