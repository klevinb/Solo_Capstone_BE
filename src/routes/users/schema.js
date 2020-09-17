const { Schema } = require('mongoose');
const mongoose = require('mongoose');
const npmValidator = require('validator');

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: (value) => {
        if (!npmValidator.isLength(value, { min: 3 })) {
          throw new Error('Name should be at least 3 chars long!');
        }
      },
    },
  },
  surname: {
    type: String,
    required: true,
    validate: {
      validator: (value) => {
        if (!npmValidator.isLength(value, { min: 3 })) {
          throw new Error('Surname should be at least 3 chars long!');
        }
      },
    },
  },
  age: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => {
        if (value < 18) throw new Error('You are too young to use this app!');
      },
    },
  },
  bio: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: async (value) => {
        if (!npmValidator.isEmail(value)) {
          throw new Error('Email is invalid!');
        } else {
          const checkEmail = await UserModel.findOne({ email: value });
          if (checkEmail) throw new Error('Email already exists!');
        }
      },
    },
  },
  password: {
    type: String,
    required: true,
  },
  role:{
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  token: {
    type: String,
  },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
