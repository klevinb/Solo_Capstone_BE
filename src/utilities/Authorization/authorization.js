const passport = require('passport');
const { Strategy } = require('passport-facebook');
const UserModel = require('../../routes/users/schema');
const { generateTokens } = require('./jwtFunctions');

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
        birthday: '',
        email: profile.emails[0].value,
        username:
          profile.name.givenName.toLocaleLowerCase() +
          profile.name.familyName.toLocaleLowerCase().slice(0, 1),
        image: '',
        password: ' ',
        events: [],
        following: [],
        messages: [],
        role: 'user',
        stories: [],
      };

      try {
        const findUser = await UserModel.findOne({ facebookId: profile.id });
        if (findUser) {
          const tokens = await generateTokens(findUser);
          done(null, {
            token: tokens.token,
            refreshToken: tokens.refreshToken,
            username: findUser.username,
          });
        } else {
          const checkUsername = await UserModel.findOne({
            username: User.username,
          });

          if (checkUsername) {
            checkUsername.facebookId = User.facebookId;
            await checkUsername.save({ validateBeforeSave: false });

            const tokens = await generateTokens(checkUsername);
            done(null, {
              token: tokens.token,
              refreshToken: tokens.refreshToken,
              username: checkUsername.username,
            });
          } else {
            const createUser = new UserModel(User);
            const user = await createUser.save();
            const tokens = await generateTokens(user);
            done(null, {
              token: tokens.token,
              refreshToken: tokens.refreshToken,
              username: user.username,
            });
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
