const badRequest = (err, req, res, next) => {
  if (err.httpStatusCode === 400) {
    res.status(400).send(err.message || 'Bad Request!');
  }
  next(err);
};

const unAuthorized = (err, req, res, next) => {
  if (err.httpStatusCode === 401) {
    res.status(401).send(err.message || 'Unauthorized!');
  }
  next(err);
};

const isForbidden = (err, req, res, next) => {
  if (err.httpStatusCode === 403) {
    res.status(403).send(err.message || 'Forbidden!');
  }
  next(err);
};

const notFound = (err, req, res, next) => {
  if (err.httpStatusCode === 404) {
    res.status(404).send(err.message || 'Not Found!');
  }
  next(err);
};

const genericError = (err, req, res, next) => {
  if (!res.headersSent) {
    res.status(err.httpStatusCode || 500).send(err.message);
  }
};

module.exports = {
  badRequest,
  unAuthorized,
  isForbidden,
  notFound,
  genericError,
};
