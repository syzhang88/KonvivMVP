/*** Any documentation here not labelled "Sam" is from Plaid's original
    Quickstart code. ***/

'use strict';

var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');
var buckets = require('./buckets');
var admin = require("firebase-admin");
var firebase = require("firebase");

const SIX_MONTHS = 6;
const ONE_MONTH = 1;

/*** SETTING UP FIREBASE, PLAID, AND EXPRESS ***/

// Sam: Begin Firebase code for configuration, initialization, and authentication.
// Currently, we are linking to DEEP's Firebase database (KonvivAndroid), no
// longer my own.
// Here is its link: https://console.firebase.google.com/project/konvivandroid/database/data
var config = {
  apiKey: "AIzaSyASB9RhrUzNme-rGkVrzEXmF3nL7PwMgvQ",
  authDomain: "konvivandroid.firebaseapp.com",
  databaseURL: "https://konvivandroid.firebaseio.com",
  projectId: "konvivandroid",
  storageBucket: "konvivandroid.appspot.com",
  messagingSenderId: "41760220514",
};

var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://konvivandroid.firebaseio.com"
});

firebase.initializeApp(config);
// Sam: End Firebase setup

// Sam: Begin Plaid code for configuration, initialization, and authentication
var APP_PORT = envvar.number('APP_PORT', Number(process.env.PORT || 8000 ));
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID', '593981e0bdc6a401d71d87b5');
var PLAID_SECRET = envvar.string('PLAID_SECRET', '271426f90259600c6bf365d6b0f0aa');
var PLAID_PUBLIC_KEY = envvar.string('PLAID_PUBLIC_KEY', '9f4ef21fdb37b5c0e3f80290db7716');
var PLAID_ENV = envvar.string('PLAID_ENV', 'development');

// Initialize the Plaid client
var client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV]
);
// Sam: End Plaid setup

// Sam: Express setup
var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.set('public token', null);
// app.set('item id', null);
// app.set('firebase', firebase.initializeApp(config));
// Sam: End Express setup

// Sam: API routes setup
// get an instance of the router for api routes
var apiRoutes = express.Router();

/*** Sam: Here is where we define actual RESTful calls (Using Express I believe;
    check on this) ***/

app.get('/', function(request, response, next) {
    console.log("app loading...");
    response.render('login.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
    console.log("app loaded");
});

app.get('/index.ejs', function(request, response, next) {
    console.log(request.body.accessToken);
    response.render('index.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/newuser.ejs', function(request, response, next) {
    response.render('newuser.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.post('/log_in', function(request, response, next) {
    console.log('Attempting log in...');
    var success = {
        login: false
    }

    // gets object to database service
    // var database = firebase.database();
    var username = request.body.username;
    var password = request.body.password;

    firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
        var user = firebase.auth().currentUser;
        // grabs admin session token
        user.getIdToken().then(function(token) {
            console.log('successfully logged into firebase');
            success = {
                login: true,
                token: token,
                error: null
            };
            firebase.auth().signOut();
            response.json(success);
            console.log("LOG IN SUCCEEDED");
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('failed to create user: ' + errorMessage);
            response.json({
                login: false,
                error: errorMessage
            });
        });
    }, function() {
        success = {
            login: false
        };
        response.json(success);
        console.log("LOG IN FAILED");
    });
});

app.post('/sign_up', function(request, response, next) {
    console.log('Attempting sign up...');

    // gets object to database service
    var database = firebase.database();
    var username = request.body.username;
    var password = request.body.password;
    var promise = firebase.auth().createUserWithEmailAndPassword(username, password).then(function() {
        // grabs admin session token
        var user = firebase.auth().currentUser;
        user.getIdToken().then(function(token) {
            response.json({
                login: true,
                token: token,
                userId: user.uid,
                error: null
            });
            firebase.auth().signOut();
            console.log('successfully created user in firebase: ' + user.uid);
        });
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('failed to create user: ' + errorMessage);
        response.json({
            login: false,
            error: errorMessage
        });
    });
    promise.catch(e => console.log(e.message));
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(request, response, next) {
    console.log("validating token: " + request.body.token);
    var token = request.body.token;

    if (token) {
        admin.auth().verifyIdToken(token).then(function(decodedToken) {
            console.log('verified Firebase token and now looking for Plaid token...');

            // grabs Plaid access token
            admin.database().ref('/users/' + decodedToken.uid).once('value', function(snapshot) {
                if (snapshot.val() && snapshot.val()['user_token']) {
                    request.body.accessToken = snapshot.val()['user_token'];
                    console.log('found existing Plaid token: ' + request.body.accessToken);
                }
                request.body.userId = decodedToken.uid;

                console.log("verified Firebase token for " + request.body.userId);
                next();
            });
        }).catch(function(error) {
            console.log('Failed to authenticate token.');
            return response.json({
                error: error,
                message: 'Failed to authenticate token.'
            });
        });
	} else {
        return response.json({
            error: new Error('Failed to find token.'),
            message: 'Failed to find token.'
        });
	}
});

apiRoutes.post('/get_access_token', function(request, response, next) {
    console.log('Getting access token...');

    app.set('public token', request.body.publicToken);
    client.exchangePublicToken(app.get('public token'), function(error, tokenResponse) {
        if (error != null) {
          var msg = 'Could not exchange public token!';
          console.log(msg + '\n' + error);
          return response.json({
            error: msg
          });
        }
        // Sam: We HAVE to store the access token, so that Plaid does not think the
        // user is a new user logging in each time.

        console.log('LOADING Access Token: ' + tokenResponse.access_token);

        admin.database().ref('users/' + request.body.userId).set({
            user_token: tokenResponse.access_token,
            item_id: tokenResponse.item_id
        });

        // console.log('Item ID: ' + ITEM_ID);
        response.json({
          'error': false
        });

        updateTransactions(SIX_MONTHS, request.body.accessToken, request.body.userId, () => {});
    });
});

apiRoutes.post('/accounts', function(request, response, next) {
  // Retrieve high-level account information and account and routing numbers
  // for each account associated with the Item.
  client.getAuth(request.body.accessToken, function(error, authResponse) {

    if (error != null) {
      var msg = 'Unable to pull accounts from the Plaid API.';
      console.log(msg + '\n' + error);
      return response.json({
        error: msg
      });
    }

    console.log("authResponse.accounts: " + authResponse.accounts);
     // [object Object],[object Object],[object Object],[object Object]
     // These are the different checking/cc banking accounts

    // Sam: Begin admin section for updating account info
    var postData = {
        'accounts': authResponse.accounts
    };

    admin.database().ref('users/' + request.body.userId).update(postData);
    console.log('posted item for: ' + request.body.userId);
    // Sam: End admin section

    response.json({
      error: false,
      accounts: authResponse.accounts,
      numbers: authResponse.numbers,
    });

  });
});

apiRoutes.post('/item', function(request, response, next) {
  // Pull the Item - this includes information about available products,
  // billed products, webhook information, and more.
  client.getItem(request.body.accessToken, function(error, itemResponse) {
    if (error != null) {
      console.log(JSON.stringify(error));
      return response.json({
        error: error
      });
    }

    // Also pull information about the institution
    client.getInstitutionById(itemResponse.item.institution_id, function(err, instRes) {
      if (err != null) {
        var msg = 'Unable to pull institution information from the Plaid API.';
        console.log(msg + '\n' + error);
        return response.json({
          error: msg
        });
      } else {
        response.json({
          item: itemResponse.item,
          institution: instRes.institution,
        });
      }
    });
  });
});

apiRoutes.post('/transactions', function(request, response, next) {
  // Pull transactions for the Item for the last 30 days to the front-end
  // Sam: I added a admin section here so that the transactions for the Item
  // are also added to the admin database
  var startDate = moment().format('YYYY-MM-DD').substr(0,8) + '01';
  var endDate = moment().format('YYYY-MM-DD');

  client.getTransactions(request.body.accessToken, startDate, endDate, {
    count: 500,
    offset: 0,
  }, function(error, transactionsResponse) {
    if (error != null) {
        console.log(JSON.stringify(error));
        return response.json({
            error: error});
        }
    transactionsResponse.transactions.forEach(function(txn, idx) {
        txn.bucket = buckets.selectBucket(txn)[0];
    });
    response.json(transactionsResponse);
  });

  updateTransactions(SIX_MONTHS, request.body.accessToken, request.body.userId, () => {});
});

apiRoutes.post('/buckets', function(request, response, next) {
    var bucketClasses = {}
    console.log("/buckets has been called");
    updateTransactions(SIX_MONTHS, request.body.accessToken, request.body.userId, function() {
        admin.database().ref('users/' + request.body.userId + '/bucketMoney').once('value', function(snapshot) {
            console.log("snapshot taken ");
            console.log(snapshot.val());
            response.json(snapshot.val());
        })
    });
});

function updateTransactions(timePeriod, accessToken, userId, callbackFunction) {
    var startDate = moment().subtract(timePeriod, 'months').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    var updatedTransactions = 'transactions are working';

    var thisMonth = new Date(endDate.substr(0, 4), endDate.substr(5, 2), '01');
    var startMonth = startDate.substr(0,8) + '01';

    client.getTransactions(accessToken, startMonth, endDate, {
      count: 500,
      offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            return console.log(error);
        }

        var bucketSpending = buckets.clone(buckets.spendingAmounts);
        var bucketFixed = buckets.clone(buckets.fixedAmounts);
        var bucketIncome = buckets.clone(buckets.incomeAmounts);
        var bucketTotal = buckets.clone(buckets.allAmounts);
        // Sam: Begin admin section for updating transaction data

        console.log(bucketTotal);
        transactionsResponse.transactions.forEach(function(transaction) {
            var bucketSelect = buckets.selectBucket(transaction);

            var bucketName = bucketSelect['bucketName'];
            var bucketClass = bucketSelect['bucketClass'];
            var newPostKey = transaction.transaction_id;
            var postData = {};
            postData[newPostKey] = transaction;

            var txnDate = transaction.date;
            var transactionDate = new Date(txnDate.substr(0, 4), txnDate.substr(5, 2), txnDate.substr(8,2));
            admin.database().ref('users/' + userId + "/bucketTransactions/" + bucketName  + "/" + transaction.date.substr(0,7)).update(postData);

            if (transactionDate >= thisMonth) {
                if (bucketClass == "Income") {
                    bucketIncome[bucketName] += transaction.amount;
                } else if (bucketClass == "Fixed") {
                    bucketFixed[bucketName] += transaction.amount;
                } else if (bucketClass == "Spending") {
                    bucketSpending[bucketName] += transaction.amount;
                }
            } else {
                // console.log("adding to bucket total: " + bucketTotal[bucket] + " + " + transaction.amount);
                bucketTotal[bucketName] += transaction.amount;
            }
        });
        //Get Bucket Spending
        // console.log(bucketSpending);
        console.log('updated bucket totals for this month:');
        console.log(bucketTotal);

        for (var bucket in bucketSpending) {
            if (!isNaN(bucketTotal[bucket])) {
                console.log("updateTransactions for " + bucket + ": " + bucketTotal[bucket] + "/" + timePeriod);
                admin.database().ref('users/' + userId + "/bucketMoney/Spending Buckets/" +
                    bucket).update({
                        Name: buckets.nameBuckets[bucket],
                        Spending: bucketSpending[bucket],
                        Total: bucketTotal[bucket]/timePeriod
                    });
            }
        }
        for (var bucket in bucketFixed) {
            admin.database().ref('users/' + userId + "/bucketMoney/Fixed Buckets/" +
                bucket).update({
                    Name: buckets.nameBuckets[bucket],
                    Spending: bucketFixed[bucket],
                    Total: bucketTotal[bucket]/timePeriod
                });
        }
        for (var bucket in bucketIncome) {
            admin.database().ref('users/' + userId + "/bucketMoney/Income Buckets/" +
                bucket).update({
                    Name: buckets.nameBuckets[bucket],
                    Spending: bucketIncome[bucket],
                    Total: bucketTotal[bucket]/timePeriod
                });
        }
        // console.log('updated bucket spending for this month:');
        // console.log(bucketSpending);

        callbackFunction();

        console.log('saved ' + transactionsResponse.transactions.length + ' transactions under ' + userId);
        updatedTransactions = buckets.clone(transactionsResponse);
    });
}

app.use('/', apiRoutes);

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
