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

module.exports = {
  isUser,
};
