const express = require('express');
const { isUser, isAdmin } = require('../../utilities/middlewares');
const EventModel = require('./schema');
const q2m = require('query-to-mongo');
const router = express.Router();

router.post('/:eventId/addParticipant', isUser, async (req, res, next) => {
  try {
    const user = await EventModel.checkParticipants(
      req.params.eventId,
      req.user._id
    );
    if (!user) {
      await EventModel.addParticipant(req.params.eventId, req.user._id);
      res.send('Added');
    } else {
      res.send('Already in Event');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
router.post(
  '/:eventId/removeParticipant/:userId',
  isUser,
  isAdmin,
  async (req, res, next) => {
    try {
      const user = await EventModel.checkParticipants(
        req.params.eventId,
        req.params.userId
      );
      if (user) {
        await EventModel.removeParticipant(
          req.params.eventId,
          req.params.userId
        );
        res.send('Removed');
      } else {
        res.send('User is not registered in event!');
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.get('/', isUser, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const events = await EventModel.find({
      name: new RegExp(
        '^' +
          (query.criteria.name && query.criteria.name.$exists === undefined
            ? query.criteria.name
            : ''),
        'i'
      ),
      performer: new RegExp(
        '^' +
          (query.criteria.performer &&
          query.criteria.performer.$exists === undefined
            ? query.criteria.performer
            : ''),
        'i'
      ),
      organizer: new RegExp(
        '^' +
          (query.criteria.organizer &&
          query.criteria.organizer.$exists === undefined
            ? query.criteria.organizer
            : ''),
        'i'
      ),
    }).populate('participants', ['name', 'surname', 'image']);

    res.status(200).send(events);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get('/:eventId', isUser, async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.eventId);

    if (event) {
      res.status(200).send(event);
    } else {
      const err = new Error('There is no event with that ID!');
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put('/:eventId', isUser, isAdmin, async (req, res, next) => {
  try {
    delete req.body._id;
    const event = await EventModel.findById(req.params.eventId);

    if (event) {
      await EventModel.findByIdAndUpdate(req.params.eventId, req.body);
      res.status(200).send('Edit was successful!');
    } else {
      const err = new Error('There is no event with that ID!');
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post('/', isUser, isAdmin, async (req, res, next) => {
  try {
    const newEvent = new EventModel(req.body);
    const { _id } = await newEvent.save();
    res.status(201).send(_id);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete('/:eventId', isUser, isAdmin, async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.eventId);

    if (event) {
      await EventModel.findByIdAndDelete(req.params.eventId);
      res.status(200).send(`Event ${event._id} was deleted!`);
    } else {
      const err = new Error('There is no event with that ID!');
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(err);
  }
});

module.exports = router;
