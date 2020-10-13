const jwt = require('jsonwebtoken');
const UserModel = require('../../routes/users/schema');

const generateTokens = async (user) => {
  try {
    const accessToken = await jwtToken({ _id: user._id });
    const refreshToken = await jwtRefreshToken({ _id: user._id });

    user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });
    await user.save({ validateModifiedOnly: true });

    return { token: accessToken, refreshToken: refreshToken };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const jwtToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: 9000 },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const jwtVerifier = (payload) =>
  new Promise((res, rej) =>
    jwt.verify(payload, process.env.SECRET_KEY, (err, credentials) => {
      if (err) {
        if (err.name == 'TokenExpiredError') {
          res(null);
        } else {
          rej(err);
        }
      } else {
        res(credentials);
      }
    })
  );

const jwtRefreshToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: 604800 },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const refreshToken = async (oldRefreshToken) => {
  try {
    //verify the refreshtoken
    const credentials = await jwtRefreshTokenVerify(oldRefreshToken);

    if (!credentials) {
      throw Error();
    } else {
      const user = await UserModel.findById(credentials._id);
      if (!user) {
        throw new Error('Access is forbiden');
      }

      const currentRefreshToken = user.refreshTokens.find(
        (token) => token.token === oldRefreshToken
      );

      if (!currentRefreshToken) {
        throw new Error('Refresh token is wrong');
      }
      const newAccessToken = await jwtToken({ _id: user._id });

      return { token: newAccessToken, refreshToken: oldRefreshToken };
    }
  } catch (error) {
    console.log(error);
    throw Error();
  }
};

const jwtRefreshTokenVerify = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_SECRET_KEY, (err, credentials) => {
      if (err) rej(err);
      res(credentials);
    })
  );

module.exports = {
  generateTokens,
  jwtVerifier,
  refreshToken,
};
