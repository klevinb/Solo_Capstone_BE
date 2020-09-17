const jwt = require('jsonwebtoken');
const UserModel = require('../../routes/users/schema');

const generateToken = async (user) => {
  try {
    const token = await jwtCreator({ _id: user._id });
    const updateUser = await UserModel.findById(user._id);

    updateUser.token = token;
    await updateUser.save({ validateModifiedOnly: true });
    return { token };
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const jwtCreator = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: 28800 },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const jwtVerifier = (payload) => {
  new Promise((res, rej) =>
    jwt.verify(payload, process.env.SECRET_KEY, (err, credentials) => {
      if (err) rej(err);
      res(credentials);
    })
  );
};

module.exports = {
  generateToken,
  jwtVerifier,
};
