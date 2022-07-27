'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID
const LocalStrategy = require('passport-local')

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  RESAVE: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'pug')

myDB(async client => {
  const myDataBase = await client.db('database').collection('users')

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log(`User ${username} attempted to log in.`)
        if (err) { return done(err) }
        if (!user) { return done(null, false) }
        if (password !== user.password) { return done(null, false) }
        return done(null, user)
      })
    }
  ))

  app.route('/').get((req, res) => {
    res.render('pug', { title: 'Connected to Database', message: 'Please login', showLogin: true });
  });

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('/profile', { username: req.user.username })
  })

  app.route('/logout').get(ensureAuthenticated, (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile')
  })

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found')
  })

  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc)
    })
  })

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next() }
    res.redirect('/')
  }

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login'})
  })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});