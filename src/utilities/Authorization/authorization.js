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
        const findFacebookId = await UserModel.findOne({
          facebookId: profile.id,
        });
        if (findFacebookId) {
          const tokens = await generateTokens(findFacebookId);
          done(null, {
            token: tokens.token,
            refreshToken: tokens.refreshToken,
            username: findFacebookId.username,
          });
        } else {
          const findUser = await UserModel.findOne({
            $or: [
              { username: User.username, email: User.email },
              { email: User.email },
            ],
          });

          if (findUser) {
            findUser.facebookId = User.facebookId;
            await findUser.save({ validateBeforeSave: false });

            const tokens = await generateTokens(findUser);
            done(null, {
              token: tokens.token,
              refreshToken: tokens.refreshToken,
              username: findUser.username,
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
