const UserModel = require('./schema');

const getUsers = async () => {
  const users = await UserModel.find();
  return users;
};

const removeUser = async (socketId) => {
  const users = await getUsers();

  const findUser = users.find((user) => user.socketId === socketId);

  if (findUser) await UserModel.findOneAndDelete({ socketId });
};

const setUsername = async (username, socketId) => {
  const findUser = await UserModel.findOne({ username });

  if (findUser) {
    await UserModel.findOneAndUpdate({ username }, { socketId });
  } else {
    const newUser = new UserModel({ username, socketId });
    await newUser.save();
  }
  return await getUsers();
};

module.exports = {
  getUsers,
  setUsername,
  removeUser,
};
