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

const app = express();
const corsOpt = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOpt));
const server = http.createServer(app);

socketio(server);

const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRoutes);

// Error Handlers
app.use(badRequest);
app.use(unAuthorized);
app.use(isForbidden);
app.use(notFound);
app.use(genericError);

console.log(listEndpoints(app));

// process.env.MONGOOSE_CONNECTION_STRING
mongoose
  .connect('mongodb://localhost:27017/Solo_Capstone', {
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
