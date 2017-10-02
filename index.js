// Documentation by Sam Zhang. Any mistakes or inaccuracies are his own.
'use strict';

var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var stringSimilarity = require('string-similarity');
var moment = require('moment');
var plaid = require('plaid');
var buckets = require('./buckets');
var insights = require('./insights');
var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

const SIX_MONTHS = 6;
const ONE_MONTH = 1;

/*** SETTING UP FIREBASE, PLAID, AND EXPRESS ***/

// Begin Firebase code for configuration, initialization, and authentication

// Currently, we are linking to DEEP's Firebase database (KonvivAndroid):
// https://console.firebase.google.com/project/konvivandroid/database/data
var config = {
  apiKey: "AIzaSyASB9RhrUzNme-rGkVrzEXmF3nL7PwMgvQ",
  authDomain: "konvivandroid.firebaseapp.com",
  databaseURL: "https://konvivandroid.firebaseio.com",
  projectId: "konvivandroid",
  storageBucket: "konvivandroid.appspot.com",
  messagingSenderId: "41760220514",
};

// Initialize ADMIN Firebase client
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://konvivandroid.firebaseio.com"
});

// Initialize normal Firebase client
firebase.initializeApp(config);

// Plaid code for configuration, initialization, and authentication
var APP_PORT = envvar.number('APP_PORT', Number(process.env.PORT || 8000 ));
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID', '57c4acc20259902a3980f7d2');
var PLAID_SECRET = envvar.string('PLAID_SECRET', '10fb233c2a93dfcd42aa1a9d8a01d1');
var PLAID_PUBLIC_KEY = envvar.string('PLAID_PUBLIC_KEY', 'ebc098404b162edaadb2b8c6c45c8f');
var PLAID_ENV = envvar.string('PLAID_ENV', 'development');

// Initialize Plaid client
var plaidClient = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV]
);

// Express setup
var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.set('public token', null);

// AI routes setup: get an instance of the router for api routes
var apiRoutes = express.Router();

// Load-testing token setup
app.use(express.static('load_test'));

// Here is where we define actual RESTful calls, using Express
// These first calls are the GET calls for rendering web pages
app.get('/', function(request, response, next) {
    console.log("app loading...");
    response.render('login.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/login.ejs', function(request, response, next) {
    response.render('login.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/bills.ejs', function(request, response, next) {
    response.render('bills.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/savings.ejs', function(request, response, next) {
    response.render('savings.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/index.ejs', function(request, response, next) {
    response.render('index.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/insights.ejs', function(request, response, next) {
    response.render('insights.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/newsfeed.ejs', function(request, response, next) {
    response.render('newsfeed.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/settings.ejs', function(request, response, next) {
    response.render('settings.ejs', {
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

app.get('/guidescreen.ejs', function(request, response, next) {
    response.render('guidescreen.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/securityscreen.ejs', function(request, response, next) {
    response.render('securityscreen.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/bucketpage.ejs', function(request, response, next) {
    response.render('bucketpage.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/plaid_info', function(request, response, next) {
    response.json({
        env: PLAID_ENV,
        key: PLAID_PUBLIC_KEY,
    });
});

// These are the GET calls for rendering test pages
app.get('/test/login.ejs', function(request, response, next) {
    response.render('test/login.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/bills.ejs', function(request, response, next) {
    response.render('test/bills.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/savings.ejs', function(request, response, next) {
    response.render('test/savings.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/index.ejs', function(request, response, next) {
    response.render('test/index.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/insights.ejs', function(request, response, next) {
    response.render('test/insights.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/newsfeed.ejs', function(request, response, next) {    response.render('test/newsfeed.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/settings.ejs', function(request, response, next) {
    response.render('test/settings.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/newuser.ejs', function(request, response, next) {
    response.render('test/newuser.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/guidescreen.ejs', function(request, response, next) {
    response.render('test/guidescreen.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/securityscreen.ejs', function(request, response, next) {
    response.render('test/securityscreen.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/bucketpage.ejs', function(request, response, next) {
    console.log('/bucketpage.ejs called');
    response.render('test/bucketpage.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

app.get('/test/plaid_info', function(request, response, next) {
    response.json({
        env: PLAID_ENV,
        key: PLAID_PUBLIC_KEY,
    });
});

// POST restful call to grab user token after a username and password is passed to it
app.post('/log_in', function(request, response, next) {
    console.loge('attempting login...');
    var success = {
        login: false
    }
    var username = request.body.username;
    var password = request.body.password;

    // Signs in using Firebase
    firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
        var user = firebase.auth().currentUser;
        // Grab individual user session token
        user.getIdToken().then(function(token) {
            success = {
                login: true,
                token: token,
                error: null
            };
            // Since the individual user session token is saved, we can log safely out of Firebase now
            firebase.auth().signOut();
            response.json(success);
            console.log('successfully logged into Firebase');
        }).catch(function(error) {
            // Handle Errors here
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
        console.log("login attempt to Firebase has failed");
    });
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(request, response, next) {
    var token = request.body.firebaseToken;

    if (token) {
        admin.auth().verifyIdToken(token).then(function(decodedToken) {
            console.log('verified Firebase token and now looking for Plaid token...');

            // grabs Plaid access token
            admin.database().ref('/users/' + decodedToken.uid).once('value', function(snapshot) {
                if (snapshot.val() && snapshot.val()['firebaseToken']) {
                    request.body.plaidToken = snapshot.val()['firebaseToken'];
                    console.log('found existing Plaid token: ' + request.body.plaidToken);
                }
                request.body.userId = decodedToken.uid;

                console.log("verified Firebase token for " + request.body.userId);
                next();
            });
        }).catch(function(error) {
            console.log('failed to authenticate token.');
            return response.json({
                error: error,
                message: 'Failed to authenticate token.'
            });
        });
	} else {
        console.log('failed to find token.');
        return response.json({
            error: new Error('Failed to find token.'),
            message: 'Failed to find token.'
        });
	}
});

// These next calls are various bucket-related functions (e.g., getting a bucket name, list of bills, etc.)

/*** Each bucket is mapped to a name that the user can modify. For example, they can rename the "Eating Out"
     bucket to "Dining." By default, each bucket just has its own name. This call outputs whatever name
     is currently set for a specific bucket. ***/
apiRoutes.post('/get_bucket_name',function(request, response, next) {
    admin.database().ref('/users/' + request.body.userId + '/bucketNames').once('value', function(snapshot) {
        for (var name in snapshot.val()) {
            if (name == request.body.name) {
                return response.json(snapshot.val()[name]['name']);
            }
        }
        return response.json({
            error: new Error("Could not find name!"),
            message: "Could not find name!"
        })
    }).catch(function(error) {
        console.log("error with getting bucket name: " + error.message);
        return response.json({
            error: error,
            message: error.message
        })
    });

});


//  This call checks if a user has access to a bank account's token on Firebase
apiRoutes.post('/bank_access', function(request, response, next){
    admin.database().ref('/users/' + request.body.userId).once('value', function(snapshot) {
        if (snapshot.val() && snapshot.val()['firebaseToken']) {
            request.body.plaidToken = snapshot.val()['firebaseToken'];
            return response.json({bank: true});
        }
        return response.json({bank: false});
    });
});

//  This call uses a string comparison to look for transactions it can identify as bills
// in the bucketTransactions path
apiRoutes.post('/bills', function(request, response, next){
    var billsList = {};
    admin.database().ref('users/' + request.body.userId + '/bucketTransactions').once('value').then(function(snapshot) {
        // First, looks for possible bills in the fixed buckets
        for (var billName in buckets.fixedAmounts) {
            for (var month in snapshot.val()[billName]) {
                var monthlyBucket = snapshot.val()[billName][month];
                for (var transaction in monthlyBucket) {
                    var perc = 0;
                    for (var bill in billsList) {
                        perc = Math.max(perc, stringSimilarity.compareTwoStrings(bill, monthlyBucket[transaction]['name']));
                    }
                    if (perc < 0.5) {
                        billsList[monthlyBucket[transaction]['name']] = monthlyBucket[transaction];
                    }
                }
            }
        }
        // Second, looks for other bills in the variable bills buckets
        for (var month in snapshot.val()['Variable Bills']) {
            var monthlyBucket = snapshot.val()['Variable Bills'][month];
            for (var transaction in monthlyBucket) {
                var perc = 0;
                for (var bill in billsList) {
                    perc = Math.max(perc, stringSimilarity.compareTwoStrings(bill, monthlyBucket[transaction]['name']));
                }
                if (perc < 0.5) {
                    billsList[monthlyBucket[transaction]['name']] = monthlyBucket[transaction];
                }
            }
        }
        response.json(billsList);
    });
});

// This call pulls up only the transactions within a specific bucket
apiRoutes.post('/transactions_for_bucket',function(request, response, next){
    var userId = request.body.userId
    var bucket = request.body.which_bucket
    var bucketPath = 'users/' + userId + '/bucketTransactions/' + bucket
    admin.database().ref(bucketPath).once('value').then(function(snapshot) {
        var bucketTransactions = snapshot.val();
        response.json(bucketTransactions);
    }).catch(function(error) {
        var errorMessage = error.message;
        response.json({
            error: error,
        });
    });
});

// This call renames a specific bucket
apiRoutes.post('/rename_bucket',function(request, response, next){
    var userId = request.body.userId
    var bucket = request.body.which_bucket
    var newName = request.body.new_name
    // console.log(request.body.token)
    var bucketPath = 'users/' + userId + '/bucketNames/' + bucket
    admin.database().ref('users/' + userId + '/bucketNames').once('value', function(snapshot) {
        for (var bucket in snapshot.val()) {
            if (newName == snapshot.val()[bucket]['name']) {
                return response.json({
                    error: new Error('Another bucket is already named this!'),
                    message: 'Another bucket is already named this!'
                });
            }
        }
        admin.database().ref(bucketPath).update({name: newName});
        response.json({
            success: true,
        });
    });

});


// This call is only called if there is an error with fetching bucket names (index.ejs, 519).
// It simply resets all bucket names to their defaults in an attempt to fix the error.
apiRoutes.post('/reset_bucket_names',function(request, response, next) {
    var postData = {reset: true};
    for (var key in buckets.nameBuckets) {
        if (buckets.nameBuckets.hasOwnProperty(key)) {
            postData[key] = {name: buckets.nameBuckets[key]};
        }
    }
    admin.database().ref("users/" + request.body.userId + "/bucketNames/").set(postData).catch(function(error) {
        console.log("error with resetting names: " + error.message);
        errorData = error;
    });
    response.json(postData);
});

/*** Each bucket is mapped to a name that the user can modify. For example, they can rename the "Eating Out"
     bucket to "Dining." By default, each bucket just has its own name. This call outputs whatever name
     is currently set for every bucket. ***/
apiRoutes.post('/bucket_names',function(request, response, next){
    admin.database().ref('users/' + request.body.userId + '/bucketNames').once('value', function(snapshot) {
        response.json(snapshot.val());
    }).catch(function(error) {
        var errorMessage = error.message;
        console.log('failed to call bucket_names: ' + errorMessage);
        response.json({
            error: error,
        });
    });
});

// This call changes a bucket's size
apiRoutes.post('/change_bucket_size',function(request, response, next){
    var userId = request.body.userId
    var fromBucket = request.body.from_bucket
    var amount = request.body.amount
    var bucketType = null;

    for (var name in buckets.fixedAmounts) {
        if (name == fromBucket) {
            bucketType = 'Fixed Buckets';
        }
    }
    for (var name in buckets.spendingAmounts) {
        if (name == fromBucket) {
            bucketType = 'Spending Buckets';
        }
    }
    if (bucketType) {
        var fromBucketPath = 'users/' + userId + '/bucketMoney/' + bucketType + '/' + fromBucket;
        //subtract from this bucket
        admin.database().ref(fromBucketPath).once('value', function(snapshot) {
            if (parseInt(snapshot.val()['Total']) + parseInt(amount) >= 0) {
                var newTotal = {
                    'Total':parseInt(snapshot.val()['Total']) + parseInt(amount)
                };
                admin.database().ref(fromBucketPath).update(newTotal);
                response.json({
                    success: true
                });
            } else {
                response.json({
                    error: new Error("Not a real number or not enough money!"),
                    message: "Not a real number or not enough money!"
                });
            }
        }).catch(function(error) {
            response.json({
                error: error,
                message: error.message
            });
        });
    } else {
        response.json({
            error: new Error('Cannot find bucket!'),
            message: 'Cannot find bucket!'
        })
    }
});

// This call moves a transaction from one bucket to another
apiRoutes.post('/move_transaction',function(request, response, next){
    var userId = request.body.userId
    var fromBucket = request.body.from_bucket
    var toBucket = request.body.to_bucket
    var transactionId = request.body.transaction_id
    var date = request.body.year_month
    if (toBucket in buckets.allAmounts && fromBucket in buckets.allAmounts) {
        var fromBucketPath = 'users/'+ userId +'/bucketTransactions/'+ fromBucket + '/' + date + '/' + transactionId;
        var toBucketPath = 'users/'+ userId +'/bucketTransactions/'+ toBucket + '/' + date + '/' + transactionId;
        buckets.moveTransaction(fromBucketPath, fromBucketPath);
    }
});


// This call runs the insights' calculations
apiRoutes.post('/calculate_insights', function(request, response, next){
    var userId = request.body.userId;
    var date = request.body.year_month;
    var pathCheck = 'users/' + userId + '/Insights';
    var lastMonth = moment().subtract(1, 'months').format('YYYY-MM-DD').substr(0,7);
    var currentMonth = moment().format('YYYY-MM-DD').substr(0,7);
    var currentMonthPath = 'users/' + userId + '/bucketTransactions/Eating Out/' + currentMonth;
    var lastMonthPath = 'users/' + userId + '/bucketTransactions/Eating Out/' + lastMonth;
    insights.getInsights(pathCheck, currentMonthPath, lastMonthPath, userId, currentMonth);
});

apiRoutes.post('/show_insights',function(request, response, next){
    var user_id = request.body.userId

    admin.database().ref('users/' + user_id + '/Insights').once('value').then(function(snapshot) {
        response.json(snapshot.val());
    }).catch(function(error) {
        var errorMessage = error.message;
        console.log('failed to call bucketInfo: ' + errorMessage);
        response.json({
            error: error,
        });
    });
});

// This method stores a user's access token in Firebase, the first time they log in,
// so that, each time the same user logs in, Plaid recognizes them and does not accidentally
// create duplicate transactions
apiRoutes.post('/get_access_token', function(request, response, next) {
    console.log('getting access token...');
    app.set('public token', request.body.publicToken);
    plaidClient.exchangePublicToken(app.get('public token'), function(error, tokenResponse) {
        if (error != null) {
          var msg = 'Could not exchange public token!';
          console.log(msg + '\n' + error);
          return response.json({
            error: error
          });
        }
        console.log('loading Access Token: ' + tokenResponse.access_token);
        admin.database().ref('users/' + request.body.userId).set({
            firebaseToken: tokenResponse.access_token,
            item_id: tokenResponse.item_id
        });
        response.json({
          'error': false
        });
        // Updates the user's account info and past transactions info
        updateAccounts(tokenResponse.plaidToken, request.body.userId, () => {});
        updateTransactions(SIX_MONTHS, request.body.plaidToken, request.body.userId, () => {});
    });
});

// This call retrieves high-level account information and account and routing numbers
// for each account associated with the Item
apiRoutes.post('/accounts', function(request, response, next) {
    updateAccounts(request.body.plaidToken, request.body.userId, function(postData) {
        console.log('/accounts called');
        response.json(postData);
    });
});

// This call pulls transactions for the Item from the last 30 days to the front-end
apiRoutes.post('/transactions', function(request, response, next) {
    var startDate = moment().format('YYYY-MM-DD').substr(0,8) + '01';
    var endDate = moment().format('YYYY-MM-DD');

    plaidClient.getTransactions(request.body.plaidToken, startDate, endDate, {
        count: 500,
        offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            console.log(JSON.stringify(error));
            return response.json({
                error: error
            });
        }
        transactionsResponse.transactions.forEach(function(txn, idx) {
            txn.bucket = buckets.selectBucket(txn)['bucketName'];
        });
        response.json(transactionsResponse);
    });
    updateTransactions(SIX_MONTHS, request.body.plaidToken, request.body.userId, () => {});
});

/*** This call:
    (1) takes in a number of months for the Emergency Fund functionality
    (2) calculates how much money needs to be saved up to cover the living expenses of that many months:
            total savings needed = (living expense of one month)  * (number of months)
    (3) saves that dollar amount in Firebase
    (4) returns it to the front end
***/
apiRoutes.post('/savings', function(request, response, next) {
    plaidClient.getAuth(request.body.plaidToken, function(error, authResponse) {
        if (error != null) {
            var msg = 'Unable to pull accounts from the Plaid API.';
            console.log(msg + '\n' + error);
            return {
                error: msg
            };
        }
        var savingsAccount = 0;
        for (var account in authResponse.accounts) {
            if (account['subtype'] == 'savings' &&  authResponse.accounts[account]['balances'] != null) {
                savingsAccount += account['balances']['current'];
            }
        }
        admin.database().ref('users/' + request.body.userId + '/bucketMoney').once('value', function(snapshot) {
            var savingsTotal = 0;
            for (var bucketClass in snapshot.val()) {
                if (bucketClass != "Savings Buckets" && bucketClass != "Income Buckets" ) {
                    for (var bucketName in snapshot.val()[bucketClass]) {
                        savingsTotal += parseInt(snapshot.val()[bucketClass][bucketName]['Total']);
                    }
                }
            }
            var postData = {
                'Savings': savingsAccount,
                'Total': savingsTotal * request.body.months
            };
            admin.database().ref('users/' + request.body.userId + '/bucketSavings/').set(postData);
            response.json(postData);
        });
    });
    updateAccounts(request.body.plaidToken, request.body.userId, () => {});
});


// Calls updateTransactions to update the list of all transactions and then returns
// data for all buckets, as well as the user's total balance, to front-end as a json file
apiRoutes.post('/buckets', function(request, response, next) {
    var bucketClasses = {}
    updateTransactions(SIX_MONTHS, request.body.plaidToken, request.body.userId, function(data) {
        admin.database().ref('users/' + request.body.userId + '/Total Balance').once('value', function(snapshot) {
            response.json({
                bucketMoney: data,
                totalBalance: snapshot.val()
            });
        });
    });
});

// Updates bank account info for a user and saves it on Firebase
function updateAccounts(plaidToken, userId, callbackFunction) {
    console.log('updating account information on Firebase');
    plaidClient.getItem(plaidToken, function(error, itemResponse) {
        if (error != null) {
            console.log(error);
            return {
                error: error
            };
        }
        var item = itemResponse.item;
        // Also pull information about the institution
        plaidClient.getInstitutionById(itemResponse.item.institution_id, function(err, instRes) {
            if (err != null) {
                var msg = 'Unable to pull institution information from the Plaid API.';
                console.log(msg + '\n' + error);
                return {
                    error: msg
                };
            }
            var institution = instRes.institution;

            plaidClient.getAuth(plaidToken, function(error, authResponse) {
                if (error != null) {
                    var msg = 'Unable to pull accounts from the Plaid API.';
                    console.log(msg + '\n' + error);
                    return {
                        error: msg
                    };
                }
                var accounts = authResponse.accounts;
                var numbers = authResponse.numbers;

                var accountData = {
                    'accounts': accounts,
                    'numbers': numbers,
                    'institution': institution,
                    'item': item
                };

                var totalBalance = 0;
                for (var account in accounts) {
                    if (accounts[account]['type'] == 'depository') {
                        totalBalance += accounts[account]['balances']['current'];
                    }
                }
                admin.database().ref('users/' + userId + '/accounts/' + item.item_id).update(accountData);
                admin.database().ref('users/' + userId).update({
                    'Total Balance': totalBalance
                });
                callbackFunction(accountData);
            });
        });
    });
}

// Updates the list of all past transactions on Firebase for a user
function updateTransactions(timePeriod, plaidToken, userId, callbackFunction) {
    var startDate = moment().subtract(timePeriod, 'months').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    var updatedTransactions = 'transactions are working';

    var thisMonth = new Date(endDate.substr(0, 4), endDate.substr(5, 2), '01');
    var startMonth = startDate.substr(0,8) + '01';

    console.log('updating transactions on Firebase...');

    plaidClient.getTransactions(plaidToken, startMonth, endDate, {
      count: 500,
      offset: 0,
    }, function(error, transactionsResponse) {
        if (error != null) {
            return console.log(error);
        }

        var bucketSpending = buckets.clone(buckets.spendingAmounts);
        var bucketFixed = buckets.clone(buckets.fixedAmounts);
        var bucketIncome = buckets.clone(buckets.incomeAmounts);
        var bucketSavings = buckets.clone(buckets.savingsAmounts);
        var bucketTotal = buckets.clone(buckets.allAmounts);

        transactionsResponse.transactions.forEach(function(transaction) {
            var bucketSelect = buckets.selectBucket(transaction);
            var bucketName = bucketSelect['bucketName'];
            var bucketClass = bucketSelect['bucketClass'];
            var postData = {};

            var txnDate = transaction.date;
            var transactionDate = new Date(txnDate.substr(0, 4), txnDate.substr(5, 2), txnDate.substr(8,2));
            var transactionOrder = txnDate.substr(8,2);
            var newPostKey = transactionOrder + transaction.transaction_id;

            transaction.bucket = bucketName;
            postData[newPostKey] = transaction;


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
                bucketTotal[bucketName] += transaction.amount;
            }
        });

        admin.database().ref('users/' + userId + '/lastEstimateUpdate').once('value', function(snapshot) {
            var returnVal = false;
            if (snapshot.val()) {
                if (thisMonth <= Date.parse(snapshot.val()["Month"])){
                    returnVal = true;
                    admin.database().ref('users/' + userId + '/bucketMoney').once('value', function(snapshot) {
                        callbackFunction(snapshot.val());
                    });
                }
                if (returnVal) {
                    return;
                }
            }
            console.log('updated bucket totals for this month');

            var allBucketData = {
                "Spending Buckets": {},
                "Fixed Buckets": {},
                "Income Buckets": {}
            }
            for (var bucket in bucketSpending) {
                if (!isNaN(bucketTotal[bucket])) {
                   allBucketData["Spending Buckets"][bucket] = {
                            Spending: bucketSpending[bucket],
                            Total: bucketTotal[bucket]/timePeriod
                        };
                }
            }
            for (var bucket in bucketFixed) {
                if (!isNaN(bucketTotal[bucket])) {
                    allBucketData["Fixed Buckets"][bucket] = {
                            Spending: bucketFixed[bucket],
                            Total: bucketTotal[bucket]/timePeriod
                        };
                }
            }
            for (var bucket in bucketIncome) {
                if (!isNaN(bucketTotal[bucket])) {
                    allBucketData["Income Buckets"][bucket] = {
                        Spending: bucketIncome[bucket],
                        Total: bucketTotal[bucket]/timePeriod
                    };
                }
            }

            admin.database().ref("users/" + userId + "/bucketMoney/").set(allBucketData);
            admin.database().ref('users/' + userId + "/lastEstimateUpdate/").update({
                "Month": thisMonth
            });
            callbackFunction(allBucketData);
        });
        console.log('saved ' + transactionsResponse.transactions.length + ' transactions under ' + userId);
    });
}

// Server runs on APP_PORT
app.use('/', apiRoutes);

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
