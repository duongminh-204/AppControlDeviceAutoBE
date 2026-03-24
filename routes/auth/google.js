require('dotenv').config();

const express = require('express');
const router = express.Router();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value
        });

        if (!user) {
          const dummyHash = await bcrypt.hash('google_oauth_no_password', 10);

          user = await User.create({
            email: profile.emails[0].value,
            passwordHash: dummyHash
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


router.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/'
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

 
    const redirectUri = `myapp://callback?token=${token}`;
    res.redirect(redirectUri);
  }
);

module.exports = router;