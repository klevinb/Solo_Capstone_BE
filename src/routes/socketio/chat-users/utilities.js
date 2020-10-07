const UserModel = require('./schema');
const ProfileModel = require('../../users/schema');
const { find } = require('../../users/schema');

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

const addMessage = async (username, refUser) => {
  const findUser = await ProfileModel.findOne({ username });
  if (findUser) {
    const msgFromUser = findUser.messages.find(
      (user) => user.username === refUser
    );
    if (msgFromUser) {
      await ProfileModel.findOneAndUpdate(
        { username, 'messages.username': refUser },
        {
          $inc: { 'messages.$.count': 1 },
        }
      );
    } else {
      findUser.messages.push({ username: refUser, count: 1 });
      await findUser.save({ validateBeforeSave: false });
    }
  }
};

const clearMsgCount = async (username, refUser) => {
  const findUser = await ProfileModel.findOne({ username });
  if (findUser) {
    const msgFromUser = findUser.messages.find(
      (user) => user.username === refUser
    );
    if (msgFromUser) {
      await ProfileModel.findOneAndUpdate(
        { username, 'messages.username': refUser },
        {
          $set: { 'messages.$.count': 0 },
        }
      );
    } else {
      findUser.messages.push({ username: refUser, count: 1 });
      await findUser.save({ validateBeforeSave: false });
    }
  }
};

module.exports = {
  getUsers,
  setUsername,
  removeUser,
  addMessage,
  clearMsgCount,
};
