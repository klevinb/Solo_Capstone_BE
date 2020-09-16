const express = require('express');
const listEndpoints = require('express-list-endpoints');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes');
const cookieParser = require('cookie-parser');
const {
  badRequest,
  unAuthorized,
  isForbidden,
  notFound,
  genericError,
} = require('./utilities/errorHandlers');

const server = express();
const port = process.env.PORT;

server.use(cors());
server.use(express.json());
server.use(cookieParser());

server.use('/api', apiRoutes);

// Error Handlers
server.use(badRequest);
server.use(unAuthorized);
server.use(isForbidden);
server.use(notFound);
server.use(genericError);

console.log(listEndpoints(server));

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dn7fa.mongodb.net/${process.env.DB_NAME}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(
    server.listen(port, () => {
      console.log(`Server runinng port: { ${port} }`);
    })
  )
  .catch((err) => console.log(err));
