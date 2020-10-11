const { Schema } = require('mongoose');
const mongoose = require('mongoose');
const npmValidator = require('validator');
const bcrypt = require('bcrypt');

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
  favorite_drinks: [
    {
      type: String,
    },
  ],
  interests: [
    {
      type: String,
    },
  ],
  birthday: {
    type: Date,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
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
          const checkEmail = await ProfileModel.findOne({ email: value });
          if (checkEmail) throw new Error('Email already exists!');
        }
      },
    },
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  refreshTokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  messages: [
    {
      username: {
        type: String,
        require: true,
      },
      count: {
        type: Number,
        require: true,
        default: 0,
      },
    },
  ],
});

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

UserSchema.statics.findByCredentials = async (credentials, password) => {
  const find = await ProfileModel.findOne({
    $or: [{ username: credentials }, { email: credentials }],
  });
  if (find) {
    const comparePw = await bcrypt.compare(password, find.password);
    if (comparePw) return find;
    else return null;
  } else return null;
};

UserSchema.statics.followToggle = async (user, username) => {
  const findUser = await ProfileModel.findOne({ username });
  const loggedInUser = await ProfileModel.findOne({ username: user });

  const iFollow = loggedInUser.following.filter(
    (user) => user._id.toString() === findUser._id.toString()
  );

  if (iFollow.length !== 0) {
    loggedInUser.following.pull(findUser._id);
    await loggedInUser.save({ validateBeforeSave: false });
    return null;
  } else {
    loggedInUser.following.push(findUser._id);
    await loggedInUser.save({ validateBeforeSave: false });
    return username;
  }
};

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;
  delete userObject.refreshTokens;

  return userObject;
};

const ProfileModel = mongoose.model('Profile', UserSchema);

module.exports = ProfileModel;
