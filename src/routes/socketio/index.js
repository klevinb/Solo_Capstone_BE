const socketio = require('socket.io');
const MessageModel = require('./messages/schema');
const { getUsers, setUsername, removeUser } = require('./chat-users/utilities');

const chat = (server) => {
  const io = socketio(server);

  io.on('connection', (socket) => {
    socket.on('setUsername', async ({ username }) => {
      const users = await setUsername(username, socket.id);
      const usernames = users.map((user) => user.username);

      io.emit('online', usernames);
    });

    socket.on('sendMessage', async (message) => {
      const onlineUsers = await getUsers();

      const newMessage = new MessageModel(message);
      const saveMessage = await newMessage.save();

      const findUser = onlineUsers.find(
        (user) => user.username === saveMessage.to
      );

      if (!findUser) {
        const err = new Error();
        err.httpStatusCode = 404;
        err.message = 'User not found!';
        throw err;
      }

      io.to(findUser.socketId).emit('message', {
        from: saveMessage.from,
        to: saveMessage.to,
        text: saveMessage.text,
      });
    });

    socket.on('disconnect', async () => {
      await removeUser(socket.id);

      const users = await getUsers();
      const usernames = users.map((user) => user.username);

      io.emit('online', usernames);
    });
  });
};

module.exports = chat;
