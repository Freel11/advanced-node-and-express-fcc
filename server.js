'use strict';
const routes = require('./routes.js')
const auth = require('./auth.js')
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const app = express();
const passport = require('passport');
const http = require('http').createServer(app)
const io = require('socket.io')(http)

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

  routes(app, myDataBase)
  auth(app, myDataBase)

  let currentUsers = 0

  io.on('connection', socket => {
    ++currentUsers
    io.emit('user count', currentUsers)

    io.on('disconnect', socket => {
      --currentUsers
      io.emit('user count', currentUsers)
    })
  })

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login'})
  })
})

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});