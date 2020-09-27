const passport = require('passport');
const { Strategy } = require('passport-facebook');
const UserModel = require('../../routes/users/schema');
const { generateToken } = require('./jwtFunctions');

passport.use(
  new Strategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_REDIRECT,
      profileFields: [
        'id',
        'email',
        'link',
        'locale',
        'name',
        'timezone',
        'updated_time',
        'verified',
        'gender',
        'displayName',
      ],
    },

    async (accesToken, refreshToken, profile, done) => {
      const User = {
        facebookId: profile.id,
        name: profile.name.givenName,
        surname: profile.name.familyName,
        age: 18,
        favorite_drinks: [],
        interests: [],
        birthday: ' ',
        email: profile.emails[0].value,
        username:
          profile.name.givenName.toLocaleLowerCase() +
          profile.name.familyName.toLocaleLowerCase().slice(0, 1),
        image: '',
        role: 'user',
        stories: [],
      };
      try {
        const findUser = await UserModel.findOne({ facebookId: profile.id });
        if (findUser) {
          const token = await generateToken(findUser);
          done(null, { token: token.token, username: findUser.username });
        } else {
          const checkUsername = await UserModel.findOne({
            username: User.username,
          });

          if (checkUsername) {
            checkUsername.facebookId = User.facebookId;
            await checkUsername.save({ validateBeforeSave: false });

            const token = await generateToken(checkUsername);
            done(null, {
              token: token.token,
              username: checkUsername.username,
            });
          } else {
            const createUser = new UserModel(User);
            const user = await createUser.save();
            const token = await generateToken(user);
            done(null, { token: token.token, username: user.username });
          }
        }
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
