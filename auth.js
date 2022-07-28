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
  	 myDataBase.findOneAndUpdate(
      { id: profile.id },
      {
        $setOnInsert: {
          id: profile.id,
          username: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },
      { upsert: true, new: true },
      (err, doc) => {
        return cb(null, doc.value)
      }
      )
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