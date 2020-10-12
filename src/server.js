const http = require('http');
const express = require('express');
const listEndpoints = require('express-list-endpoints');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes');
const cookieParser = require('cookie-parser');
const socketio = require('./routes/socketio/index');
const {
  badRequest,
  unAuthorized,
  isForbidden,
  notFound,
  genericError,
} = require('./utilities/errorHandlers');
require('./utilities/Authorization/authorization');
const passport = require('passport');

const app = express();
const corsOpt = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

const server = http.createServer(app);
app.use(cors(corsOpt));

socketio(server);

const port = process.env.PORT || 3005;

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiRoutes);

// Error Handlers
app.use(badRequest);
app.use(unAuthorized);
app.use(isForbidden);
app.use(notFound);
app.use(genericError);

console.log(listEndpoints(app));

// 'mongodb://localhost:27017/Solo_Capstone'
mongoose
  .connect(process.env.MONGOOSE_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then(
    server.listen(port, () => {
      console.log(`Server runinng port: { ${port} }`);
    })
  )
  .catch((err) => console.log(err));
