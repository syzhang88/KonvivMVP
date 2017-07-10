/*** Any documentation here not labelled "Sam" is from Plaid's original
    Quickstart code. ***/

'use strict';

var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');
var buckets = require('./buckets');

const NUMBER_DAYS = 30;

// Sam: @ARCHAN, you need to find a way to securely store this when users log in
// after they have made their accounts
var USER_NAME = 'szhang@gmail.com'; // EMAIL
var PASS_WORD = 'password';
var USER_ID = 'samUnwise';
//var SAVED_ACCESS_TOKEN = 'access-sandbox-bda31429-1f95-42c8-974f-fc6d34937da9';



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
// gets object to database service
var database = firebase.database();
firebase.auth().signInWithEmailAndPassword(USER_NAME, PASS_WORD).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log('failed to log into Firebase: ' + errorMessage);
});
// Sam: End Firebase setup

// Sam: Begin Plaid code for configuration, initialization, and authentication
var APP_PORT = envvar.number('APP_PORT', 8000);
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID', '593981e0bdc6a401d71d87b5');
var PLAID_SECRET = envvar.string('PLAID_SECRET', '271426f90259600c6bf365d6b0f0aa');
var PLAID_PUBLIC_KEY = envvar.string('PLAID_PUBLIC_KEY', '9f4ef21fdb37b5c0e3f80290db7716');
var PLAID_ENV = envvar.string('PLAID_ENV', 'sandbox');

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
    PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
    PLAID_ENV: PLAID_ENV,
  });
});

// app.get('/index.js', function(request, response, next) {
//   response.render('index.js', {
//     PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
//     PLAID_ENV: PLAID_ENV,
//   });
// });

// app.get('/login.ejs', function(request, response, next) {
//   response.render('login.ejs', {
//     PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
//     PLAID_ENV: PLAID_ENV,
//   });
// });


app.get('/index.ejs', function(request, response, next) {
  response.render('index.ejs', {
    PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
    PLAID_ENV: PLAID_ENV,
  });
});



// app.get('/', function(request, response, next) {
//   response.render('index.ejs', {
//     PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
//     PLAID_ENV: PLAID_ENV,
//   });
// });



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
    // user is a new user logging in each time. Even if the same username and
    // password is used, if we do not reuse the same ACCESS TOKEN, Plaid will
    // assume it is drawing data for the first time and give all the transactions,
    // accounts, etc. new IDs. This will cre duplicate transactions, accounts,
    // and data in general in our Firebase database unless we use the same access
    // token to log in each time.
    // tl;dr: Right now, we can see I'm just manually entering the same access
    // token, but we need to find a way to store it somewhere, perhaps on Firebase.
    // We need to ask around; ask Deep and Luz for engineering friends to help.
    //ACCESS_TOKEN = SAVED_ACCESS_TOKEN;
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
  var startDate = moment().subtract(NUMBER_DAYS, 'days').format('YYYY-MM-DD');
  var endDate = moment().format('YYYY-MM-DD');
  client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
    count: 250,
    offset: 0,
  }, function(error, transactionsResponse) {
    if (error != null) {
      console.log(JSON.stringify(error));
      return response.json({
        error: error
      });
    }

    // Sam: Begin Firebase section for updating transaction data
    transactionsResponse.transactions.forEach(function(transaction) {
        var bucket = buckets.selectBucket(transaction);
        var newPostKey = transaction.transaction_id;
        var postData = {}
        postData[newPostKey] = transaction;
        firebase.database().ref('users/' + USER_ID + "/bucketTransactions/" + bucket).update(postData);
    });

    var pathTransaction = 'users/' + USER_ID + "/bucketTransactions/";
    var pathMoney = 'users/' + USER_ID + "/bucketMoney";
    buckets.estimateSize(transactionsResponse.transactions, USER_ID, NUMBER_DAYS,
        pathTransaction, pathMoney);

    console.log('saved transactions under ' + USER_ID);
    // Sam: End Firebase section

    console.log('pulled ' + transactionsResponse.transactions.length + ' transactions');

    response.json(transactionsResponse);
  });
});

//

app.get('/buckets', function(request, response, next) {
    console.log("/buckets has been called");
    var bucketRef = firebase.database().ref('users/' + USER_ID + '/bucketMoney');
    bucketRef.on('value', function(snapshot) {
        var bucketsList = {}
        console.log("snapshot taken ");
        for (var key in snapshot.val()) {
            console.log("data is being pulled...");

            // Sam: Checks that we're only looking at keys we made. Google
            // 'HasOwnProperty' for more info

            if (snapshot.val().hasOwnProperty(key)) {
                var bucket = snapshot.val()[key];
                bucketsList[bucket['Name']] = {'Remaining': bucket['Remaining'], 'Total': bucket['Total']};
                console.log(bucket['Name'] + ' bucket: ' + bucketsList[bucket['Name']]['Remaining']
                    + " remaining out of " + bucketsList[bucket['Name']]['Total']);
            }
        }

         console.log("printing bucketsList: " + bucketsList)
        response.json(bucketsList);
    });
});

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
