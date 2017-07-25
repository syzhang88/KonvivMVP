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

// We store the access_token in memory - in production, store it in a secure
// persistent data store
// var ACCESS_TOKEN = null;
// var PUBLIC_TOKEN = null;
// var ITEM_ID = null;

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
app.set('access token', null);
app.set('public token', null);
app.set('item id', null);
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

    var success = {login: false}

    // gets object to database service
    var database = firebase.database();
    var username = request.body.username;
    var password = request.body.password;

    firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
        var user = firebase.auth().currentUser;
        // grabs Firebase session token
        user.getIdToken().then(function(token) {
            console.log('successfully logged into Firebase');
            // grabs Plaid access token
            firebase.database().ref('/users/' + user.uid).once('value', function(snapshot) {
                if (snapshot.val() && snapshot.val()['user_token']) {
                    app.set('access token', snapshot.val()['user_token']);
                    console.log('found existing access token: ' + app.get('access token'));
                }
                success = {
                    login: true,
                    token: token,
                    error: null
                };
                response.json(success);
                console.log("LOG IN SUCCEEDED");
            })
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
        // grabs Firebase session token
        var user = firebase.auth().currentUser;
        user.getIdToken().then(function(token) {
            console.log('successfully created user in Firebase');
            response.json({
                login: true,
                token: token,
                error: null
            });
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

app.get('/log_out', function(request, response, next) {
    firebase.auth().signOut().catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('failed to log out of Firebase: ' + errorMessage);
        response.json({logout: false});
    }).then(function() {
        console.log('successfully logged out of Firebase');
        response.json({logout: true});
    });
});

app.get('/log_in_status', function(request, response, next) {
    var user = firebase.auth().currentUser;
    if (user) {
        console.log('log in status:' + user.uid);
        response.json({login: true});
    } else {
        console.log('log in status: no current user');
        response.json({login: false});
    }
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(request, response, next) {
    // console.log("validating token: " + request.body.token);
    var token = request.body.token;

    if (token) {
        admin.auth().verifyIdToken(token).then(function(decodedToken) {
            request.body.userId = decodedToken.uid;
            next();
        }).catch(function(error) {
            return response.json({
                error: error,
                message: 'Failed to authenticate token.' });
        });
	} else {
        firebase.auth().signOut().catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('failed to log out of Firebase: ' + errorMessage);
        }).then(function() {
            response.render('login.ejs', {
                PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
                PLAID_ENV: PLAID_ENV,
            });
        });
	}
});

apiRoutes.post('/get_access_token', function(request, response, next) {
    app.set('public token', request.body.public_token);
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
        app.set('access token', tokenResponse.access_token);
        // ITEM_ID = tokenResponse.item_id;

        console.log('LOADING Access Token: ' + app.get('access token'));

        firebase.database().ref('users/' + request.body.userId).set({
            user_token: app.get('access token'),
            item_id: tokenResponse.item_id
        });

        // console.log('Item ID: ' + ITEM_ID);
        response.json({
          'error': false
        });

        updateTransactions(SIX_MONTHS, request.body.userId, () => {});
    });
});

apiRoutes.post('/accounts', function(request, response, next) {
  // Retrieve high-level account information and account and routing numbers
  // for each account associated with the Item.
  client.getAuth(app.get('access token'), function(error, authResponse) {

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

    // Sam: Begin Firebase section for updating account info
    var postData = {
        'accounts': authResponse.accounts
    };

    firebase.database().ref('users/' + request.body.userId).update(postData);
    console.log('posted item for: ' + request.body.userId);
    // Sam: End Firebase section

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
  client.getItem(app.get('access token'), function(error, itemResponse) {
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
  // Sam: I added a Firebase section here so that the transactions for the Item
  // are also added to the Firebase database
  var startDate = moment().format('YYYY-MM-DD').substr(0,8) + '01';
  var endDate = moment().format('YYYY-MM-DD');

  client.getTransactions(app.get('access token'), startDate, endDate, {
    count: 500,
    offset: 0,
  }, function(error, transactionsResponse) {
    if (error != null) {
        console.log(JSON.stringify(error));
        return response.json({
            error: error});
        }
    transactionsResponse.transactions.forEach(function(txn, idx) {
        if (txn.category) {
            txn.bucket = buckets.selectBucket(txn);
        }
    });
    response.json(transactionsResponse);
  });

  updateTransactions(SIX_MONTHS, request.body.userId, () => {});
});

apiRoutes.post('/buckets', function(request, response, next) {
    var bucketsList = {}
    console.log("/buckets has been called");
    updateTransactions(SIX_MONTHS, request.body.userId, function() {
        firebase.database().ref('users/' + request.body.userId + '/bucketMoney').once('value', function(snapshot) {
            console.log("snapshot taken ");
            for (var key in snapshot.val()) {
                console.log("data is being pulled...");
                // Sam: hasOwnProperty(key) checks that we're only looking at keys we made. Google
                // 'HasOwnProperty' for more info
                if (snapshot.val().hasOwnProperty(key)) {
                    var bucket = snapshot.val()[key];
                    bucketsList[bucket['Name']] = {'Spending': bucket['Spending'], 'Total': bucket['Total']};
                    console.log(bucket['Name'] + ' bucket: ' + bucketsList[bucket['Name']]['Spending']
                        + " spent this month out of " + bucketsList[bucket['Name']]['Total']);
                }
            }
            console.log("printing working bucketsList: ");
            console.log(bucketsList);
            response.json(bucketsList);
        })
    });
});

function updateTransactions(timePeriod, userId, callbackFunction) {
    var startDate = moment().subtract(timePeriod, 'months').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    var updatedTransactions = 'transactions are working';

    var thisMonth = new Date(endDate.substr(0, 4), endDate.substr(5, 2), '01');

    var startMonth = startDate.substr(0,8) + '01';

    client.getTransactions(app.get('access token'), startMonth, endDate, {
      count: 500,
      offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            return console.log(error);
        }

        var bucketSpending = buckets.clone(buckets.bucketAmounts);
        var bucketTotal = buckets.clone(buckets.bucketAmounts);
        // Sam: Begin Firebase section for updating transaction data
        transactionsResponse.transactions.forEach(function(transaction) {
            var bucket = buckets.selectBucket(transaction);
            var newPostKey = transaction.transaction_id;
            var postData = {}
            postData[newPostKey] = transaction;
            firebase.database().ref('users/' + userId + "/bucketTransactions/" + bucket).update(postData);

            var txnDate = transaction.date;
            var transactionDate = new Date(txnDate.substr(0, 4), txnDate.substr(5, 2), txnDate.substr(8,2));

            if (transactionDate >= thisMonth) {
                bucketSpending[bucket] += transaction.amount;
            } else {
                bucketTotal[bucket]+= transaction.amount;
            }
        });
        //Get Bucket Spending
        for (var bucket in bucketSpending) {
            firebase.database().ref('users/' + userId + "/bucketMoney/" +
                bucket).update({
                    Name: buckets.nameBuckets[bucket],
                    Spending: bucketSpending[bucket],
                    Total: bucketTotal[bucket]/timePeriod
                });
        }
        console.log('updated bucket spending for this month:');
        console.log(bucketSpending);

        callbackFunction();

        console.log('saved ' + transactionsResponse.transactions.length + ' transactions under ' + userId);
        updatedTransactions = buckets.clone(transactionsResponse);
    });
}

app.use('/', apiRoutes);

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
