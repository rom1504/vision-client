'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const config = require('./config');
const {Datastore} = require('@google-cloud/datastore');
const DatastoreStore = require('@google-cloud/connect-datastore')(session);
const oauth2 = require('./lib/oauth2');

const app = express();

app.disable('etag');
app.set('trust proxy', true);


// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
app.use(oauth2.template);

// [START session]
// Configure the session and session storage.
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.get('SECRET'),
  signed: true,
  store: new DatastoreStore({
    dataset: new Datastore(),
    kind: 'express-sessions',
  }),
};

app.use(session(sessionConfig));
// [END session]

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/oauth2').router);

// Frames
app.use('/api/frames', require('./frames/api-frame'));

// Videos
app.use('/api/videos', require('./videos/api-video'));

// Objects
app.use('/api/objects', require('./objects/api-object'));

var pathRoot = `${__dirname}/front/build`

app.use('/', express.static(pathRoot))
app.get('/*', function (req, res) {
  res.sendFile(pathRoot + '/index.html')
})

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
  // Start the server
  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
