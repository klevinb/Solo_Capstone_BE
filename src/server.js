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
const server = http.createServer(app);

socketio(server);

const port = process.env.PORT;

app.use(cors());
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
