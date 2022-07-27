require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github').Strategy;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log(`User ${username} attempted to log in.`)
        if (err) { return done(err) }
        if (!user) { return done(null, false) }
        if (!bcrypt.compareSync(password, user.password)) { return done(null, false) }
        return done(null, user)
      })
    }
  ))

  passport.use(new GithubStrategy({
  	clientID: process.env.GITHUB_CLIENT_ID,
  	clientSecret: process.env.GITHUB_CLIENT_SECRET,
  	callbackURL: 'https://advanced-node-and-express-fcc.herokuapp.com/auth/github/callback'
  },
  function(accessToken, refreshToken, profile, cb) {
  	console.log(profile)
  }))

  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc)
    })
  })
}