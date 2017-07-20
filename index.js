/*** Any documentation here not labelled "Sam" is from Plaid's original
    Quickstart code. ***/

'use strict';

var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');
var buckets = require('./buckets');

const SIX_MONTHS = 180;
const ONE_MONTH = 30;

// Sam: @ARCHAN, you need to find a way to securely store this when users log in
// after they have made their accounts
var USER_ID = null;
var USER_EMAIL = null;

/*** SETTING UP FIREBASE, PLAID, AND EXPRESS ***/

// Sam: Begin Firebase code for configuration, initialization, and authentication.
// Currently, we are linking to DEEP's Firebase database (KonvivAndroid), no
// longer my own.
// Here is its link: https://console.firebase.google.com/project/konvivandroid/database/data
var firebase = require("firebase");
var config = {
  apiKey: "AIzaSyASB9RhrUzNme-rGkVrzEXmF3nL7PwMgvQ",
  authDomain: "konvivandroid.firebaseapp.com",
  databaseURL: "https://konvivandroid.firebaseio.com",
  projectId: "konvivandroid",
  storageBucket: "konvivandroid.appspot.com",
  messagingSenderId: "41760220514",
};

firebase.initializeApp(config);
// Sam: End Firebase setup

// Sam: Begin Plaid code for configuration, initialization, and authentication
var APP_PORT = envvar.number('APP_PORT', Number(process.env.PORT || 3000 ));
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID', '593981e0bdc6a401d71d87b5');
var PLAID_SECRET = envvar.string('PLAID_SECRET', '271426f90259600c6bf365d6b0f0aa');
var PLAID_PUBLIC_KEY = envvar.string('PLAID_PUBLIC_KEY', '9f4ef21fdb37b5c0e3f80290db7716');
var PLAID_ENV = envvar.string('PLAID_ENV', 'development');

// We store the access_token in memory - in production, store it in a secure
// persistent data store
var ACCESS_TOKEN = null;
var PUBLIC_TOKEN = null;
var ITEM_ID = null;

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
// Sam: End Express setup


/*** Sam: Here is where we define actual RESTful calls (Using Express I believe;
    check on this) ***/

/* Call log in page */

/* if no plaid account, direct to index.ejs */

/* if have both konviv and plaid account, go to bucket page */

/*AUTHENTICATION PAGE: just added the login.ejs page*/

app.get('/', function(request, response, next) {
  response.render('login.ejs', {
  //   PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
  //   PLAID_ENV: PLAID_ENV,
  });
});

app.get('/index.ejs', function(request, response, next) {
  response.render('index.ejs', {
  //   PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
  //   PLAID_ENV: PLAID_ENV,
  });
});

app.get('/newuser.ejs', function(request, response, next) {
  response.render('newuser.ejs', {
    PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
    PLAID_ENV: PLAID_ENV,
  });
});

app.post('/get_access_token', function(request, response, next) {
    PUBLIC_TOKEN = request.body.public_token;
    client.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
        if (error != null) {
          var msg = 'Could not exchange public_token!';
          console.log(msg + '\n' + error);
          return response.json({
            error: msg
          });
        }
        // Sam: We HAVE to store the access token, so that Plaid does not think the
        // user is a new user logging in each time.
        ACCESS_TOKEN = tokenResponse.access_token;
        ITEM_ID = tokenResponse.item_id;
        console.log('LOADING Access Token: ' + ACCESS_TOKEN);

        firebase.database().ref('users/' + USER_ID).set({
            user_token: ACCESS_TOKEN
        });

        console.log('Item ID: ' + ITEM_ID);
        response.json({
          'error': false
        });

        updateTransactions(SIX_MONTHS, estimateBuckets);
    });
});

app.get('/accounts', function(request, response, next) {
  // Retrieve high-level account information and account and routing numbers
  // for each account associated with the Item.
  client.getAuth(ACCESS_TOKEN, function(error, authResponse) {

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

    firebase.database().ref('users/' + USER_ID).update(postData);
    console.log('posted item for: ' + USER_ID);
    // Sam: End Firebase section

    response.json({
      error: false,
      accounts: authResponse.accounts,
      numbers: authResponse.numbers,
    });

  });
});

app.post('/item', function(request, response, next) {
  // Pull the Item - this includes information about available products,
  // billed products, webhook information, and more.
  client.getItem(ACCESS_TOKEN, function(error, itemResponse) {
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

app.post('/transactions', function(request, response, next) {
  // Pull transactions for the Item for the last 30 days to the front-end
  // Sam: I added a Firebase section here so that the transactions for the Item
  // are also added to the Firebase database
  var startDate = moment().format('YYYY-MM-DD').substr(0,8) + '01';
  var endDate = moment().format('YYYY-MM-DD');

  client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
    count: 500,
    offset: 0,
  }, function(error, transactionsResponse) {
    if (error != null) {
        console.log(JSON.stringify(error));
        return response.json({
            error: error});
        }
    response.json(transactionsResponse);
  });

  updateTransactions(SIX_MONTHS, () => {});
});

app.get('/buckets', function(request, response, next) {
    var bucketsList = {}
    console.log("/buckets has been called");
    updateTransactions(SIX_MONTHS, function() {
        firebase.database().ref('users/' + USER_ID + '/bucketMoney').once('value', function(snapshot) {
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

app.post('/log_in', function(request, response, next) {
    console.log('Attempting log in...');

    var success = {login: false}

    // gets object to database service
    var database = firebase.database();
    var username = request.body.username;
    var password = request.body.password;

    firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
        console.log('successfully logged into Firebase');
        USER_ID = firebase.auth().currentUser.uid;
        USER_EMAIL = username;
        success = {login: true}
        firebase.database().ref('/users/' + USER_ID).once('value', function(snapshot) {
            if (snapshot.val() && snapshot.val()['user_token']) {
                ACCESS_TOKEN = snapshot.val()['user_token'];
                console.log('found existing access token: ' + ACCESS_TOKEN);
            }
            response.json(success);
        })
        console.log("LOG IN SUCCESS: " + success['login']);
    });
});

app.post('/sign_up', function(request, response, next) {
    console.log('Attempting sign up...');

    // gets object to database service
    var database = firebase.database();
    var username = request.body.username;
    var password = request.body.password;
    var promise = firebase.auth().createUserWithEmailAndPassword(username, password).then(function() {
        console.log('successfully created user in Firebase');
        response.json({login: true});
        USER_ID = firebase.auth().currentUser.uid;
        USER_EMAIL = username;
    }, function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('failed to create user: ' + errorMessage);
        response.json({login: false});
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
        USER_ID = null;
        USER_EMAIL = null;
    });
});

app.get('/user_exists', function(request, response, next) {
    var usersRef = firebase.database().ref('users/');
    usersRef.child(request.body.userId).once('value', function(snapshot) {
        response.json({exists: (snapshot.val() !== null)});
    });
});

app.get('/log_in_status', function(request, response, next) {
    if (USER_ID && USER_EMAIL) {
        response.json({login: true});
    } else {
        response.json({login: false});
    }
});

function estimateBuckets() {
    var pathTransaction = 'users/' + USER_ID + "/bucketTransactions/";
    var pathAccounts = 'users/' + USER_ID + "/accounts";
    var pathMoney = 'users/' + USER_ID + "/bucketMoney";
    var bucketAmounts = {};

    firebase.database().ref(pathTransaction).once('value', function(snapshot) {
        console.log('estimating bucket sizes...');
        var transactions = snapshot.val();
        var totalBalance = 0;

        firebase.database().ref(pathAccounts).once('value', function(snapshot) {
            for (var key in snapshot.val()) {
                var account = snapshot.val()[key];
                if (account.balances != null) {
                    if (account.balances.available != null) {
                        totalBalance += account.balances.available;
                    } else {
                        totalBalance += account.balances.current;
                    }
                }
                console.log(totalBalance);
            }
            bucketAmounts = buckets.estimateSize(transactions, SIX_MONTHS, totalBalance);
            firebase.database().ref(pathMoney).update(bucketAmounts);
            console.log('uploaded bucket size estimations');
        });
    });
}

function updateTransactions(timePeriod, callbackFunction) {
    var startDate = moment().subtract(timePeriod, 'days').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    var updatedTransactions = 'transactions are working';

    client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
      count: 500,
      offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            return console.log(error);
        }

        var bucketAmounts = buckets.clone(buckets.bucketAmounts);
        // Sam: Begin Firebase section for updating transaction data
        transactionsResponse.transactions.forEach(function(transaction) {
            var bucket = buckets.selectBucket(transaction);
            var newPostKey = transaction.transaction_id;
            var postData = {}
            postData[newPostKey] = transaction;
            firebase.database().ref('users/' + USER_ID + "/bucketTransactions/" + bucket).update(postData);

            //Get Bucket Spending
            // console.log(endDate.substr(0,4));
            var txnDate = transaction.date;

            var transactionDate = new Date(txnDate.substr(0, 4), txnDate.substr(5, 2), txnDate.substr(8,2));
            var thisMonth = new Date(endDate.substr(0, 4), endDate.substr(5, 2), '01');
            // console.log('date comparison running: ')

            if (transactionDate >= thisMonth) {
                // console.log('date comparison working')
                bucketAmounts[bucket] += transaction.amount;
            }
        });
        //Get Bucket Spending
        for (var bucket in bucketAmounts) {
            firebase.database().ref('users/' + USER_ID + "/bucketMoney/" +
                bucket).update({
                    Spending: bucketAmounts[bucket]
                });
        }
        console.log('updated bucket spending for this month:');
        console.log(bucketAmounts);

        callbackFunction();

        console.log('saved ' + transactionsResponse.transactions.length + ' transactions under ' + USER_ID);
        updatedTransactions = buckets.clone(transactionsResponse);
    });
}

function updateMonthlySpending() {
    console.log("current date: " + moment().format('YYYY-MM-DD'));
    var startDate = moment().format('YYYY-MM-DD').substr(0,8) + '01';
    var endDate = moment().format('YYYY-MM-DD');
    console.log("start date: " + startDate)

    client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
      count: 500,
      offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            console.log(JSON.stringify(error));
        }

        var bucketAmounts = buckets.clone(buckets.bucketAmounts);
        // Sam: Begin Firebase section for updating transaction data
        transactionsResponse.transactions.forEach(function(transaction) {
            var bucket = buckets.selectBucket(transaction);
            bucketAmounts[bucket] += transaction.amount;
        });
        for (var bucket in bucketAmounts) {
            firebase.database().ref('users/' + USER_ID + "/bucketMoney/" +
                bucket).update({
                    Spending: bucketAmounts[bucket]
                });
        }
        console.log('updated bucket spending for this month:');
        console.log(bucketAmounts);
    });
}

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
