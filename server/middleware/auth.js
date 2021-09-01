const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  console.log('create session');
  if (req.cookies && req.cookies.cookieName === 'invalidLink') {
    req['session'] = { invalidLink: true };
    // delete req.cookies.cookieName;
    // res.clearCookie('invalidLink');
    console.log('invalidLink is true');
    next();
  } else {
    console.log('here?');
    Promise.resolve(models.Sessions.create())
      .then((results) => {
        console.log('results -> ' + JSON.stringify(results));
        return models.Sessions.get({ id: results.insertId })
          .then((sessionInfo) => {
            console.log('sessionInfo ' + JSON.stringify(sessionInfo));
            return models.Users.get({ id: sessionInfo.id })
              .then((userInfo) => {
                if (userInfo !== undefined) {
                  // req.cookies = req.cookies || sessionInfo.hash;
                  // console.log('username ' + userInfo.username );
                  req['session'] = { hash: sessionInfo.hash, userId: sessionInfo.id, user: { username: userInfo.username } };
                  res['cookies'] = { 'shortlyid': { value: sessionInfo.hash } };
                  res.cookie('cookieName', sessionInfo.hash, { maxAge: 900000, httpOnly: true });
                  next();
                } else if (req.cookies !== undefined && req.cookies.shortlyid) {
                  return models.Sessions.get({ hash: req.cookies.shortlyid })
                    .then((existingSession) => {
                      req['session'] = existingSession;
                      res['cookies'] = { 'shortlyid': { value: req.cookies.shortlyid } };
                      res.cookie('cookieName', sessionInfo.hash, { maxAge: 900000, httpOnly: true });
                      next();
                    });
                } else {
                  console.log(req.body.username || 'invalid');
                  req['session'] = { hash: sessionInfo.hash, userId: sessionInfo.id, user: null };
                  res['cookies'] = { 'shortlyid': { value: sessionInfo.hash } };
                  res.cookie('cookieName', sessionInfo.hash, { maxAge: 900000, httpOnly: true });
                  console.log('there is no user');
                  next();
                }
              });
          });
      })
      .error((err) => {
        console.error(err);
      })
      .catch((stuff) => {
        console.log(stuff);
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  console.log('verify session');
  console.log('req.session.invalidLink ' + req.session.invalidLink);
  console.log('request.session-> ' + JSON.stringify(req.session));
  if (req.session.invalidLink) {
    next();
  } else {
    if (models.Sessions.isLoggedIn(req.session)) {
      next();
    } else {
      models.Sessions.delete({ hash: req.session.hash })
        .then(() => {
          console.log('back to login');
          res.redirect('/login');
        });
    }

  }
  // var sessionIsVerified = models.Sessions.isLoggedIn(req.session);
  // console.log('sessionIsVerified ' + sessionIsVerified);
  // if (!sessionIsVerified || !req.session.invalidLink) {
  //   models.Sessions.delete({ hash: req.session.hash })
  //     .then(() => {
  //       console.log('back to login')
  //       res.redirect('/login');
  //     });
  // } else {
  //   console.log('test -> ' + req.session.invalidLink);
  //   next();
  // }
};
