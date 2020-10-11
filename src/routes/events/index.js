const express = require('express');
const { isUser, isAdmin } = require('../../utilities/middlewares');
const EventModel = require('./schema');
const q2m = require('query-to-mongo');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const axios = require('axios');

paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

// route for paypal payment for events
router.post('/buyEvent/:eventId', isUser, async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.eventId);
    if (event) {
      const create_payment_json = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url:
            process.env.BACKEND_URL +
            '/api/events/paypal?eventId=' +
            req.params.eventId +
            '&userId=' +
            req.user._id,
          cancel_url: process.env.FRONTEND_URL,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: event.name,
                  sku: 'item',
                  price: event.price,
                  currency: 'USD',
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: 'USD',
              total: event.price,
            },
            description: `This payment it for ${event.name}. The event description ${event.description}`,
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          res.json(payment.links[1].href);
        }
      });
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

// paypal call back payment
router.get('/paypal', async (req, res, next) => {
  try {
    const execute_payment_json = {
      payer_id: req.query.PayerID,
    };

    const paymentId = req.query.paymentId;

    paypal.payment.execute(paymentId, execute_payment_json, async function (
      error,
      payment
    ) {
      if (error) {
        throw error;
      } else {
        try {
          await EventModel.addParticipant(req.query.eventId, req.query.userId);
          await axios.post(
            process.env.BACKEND_URL +
              '/api/users/' +
              req.query.eventId +
              '/pdf' +
              '/' +
              req.query.userId
          );
        } catch (error) {
          console.log(error);
        }
      }
    });
    console.log(process.env.FRONTEND_URL + '/profile');
    res.redirect(process.env.FRONTEND_URL + '/profile');
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// route that removes user from a participants list at the event
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

// route that gets all the events
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

// route that gets 3 events even when they are not users
router.get('/notUser', async (req, res, next) => {
  try {
    const events = await EventModel.find({});
    if (events.length > 3) {
      res.status(200).send(events.slice(0, 3));
    }
    res.status(200).send(events);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// route that return a specific event
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

// route that edits a specific event
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

// route for creating new event
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

// route for deleting a specific event
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
