// Documentation by Sam Zhang. Any mistakes or inaccuracies are his own.
'use strict';

var envvar = require('envvar');
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');
var plaid = require('plaid');
var buckets = require('./buckets');
var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

const SIX_MONTHS = 6;
const ONE_MONTH = 1;

/*** SETTING UP FIREBASE, PLAID, AND EXPRESS ***/

// Begin Firebase code for configuration, initialization, and authentication.

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

// Initialize ADMIN Firebase plaidClient
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://konvivandroid.firebaseio.com"
});

// // Initialize normal Firebase plaidClient
// firebase.initializeApp(config);
// // End Firebase setup

// Begin Plaid code for configuration, initialization, and authentication
var APP_PORT = envvar.number('APP_PORT', Number(process.env.PORT || 8000 ));
var PLAID_CLIENT_ID = envvar.string('PLAID_CLIENT_ID', '593981e0bdc6a401d71d87b5');
var PLAID_SECRET = envvar.string('PLAID_SECRET', '271426f90259600c6bf365d6b0f0aa');
var PLAID_PUBLIC_KEY = envvar.string('PLAID_PUBLIC_KEY', '9f4ef21fdb37b5c0e3f80290db7716');
var PLAID_ENV = envvar.string('PLAID_ENV', 'development');

// Initialize Plaid client
var plaidClient = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV]
);
// End Plaid setup

// Express setup
var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.set('public token', null);
// End Express setup

// AI routes set up: get an instance of the router for api routes
var apiRoutes = express.Router();

// Here is where we define actual RESTful calls, using Express:

app.get('/', function(request, response, next) {
    console.log("app loading...");
    response.render('login.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
    console.log("app loaded");
});

// app.get('/test.ejs', function(request, response, next) {
//     console.log("app loading...");
//     response.render('test.ejs', {
//         PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
//         PLAID_ENV: PLAID_ENV,
//     });
//     console.log("app loaded");
// });

app.get('/bills.ejs', function(request, response, next) {
    console.log("app loading...");
    response.render('bills.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
    console.log("app loaded");
});

app.get('/savings.ejs', function(request, response, next) {
    console.log("app loading...");
    response.render('savings.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
    console.log("app loaded");
});

app.get('/login.ejs', function(request, response, next) {
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
    console.log('/bucketpage.ejs called');
    response.render('bucketpage.ejs', {
        PLAID_PUBLIC_KEY: PLAID_PUBLIC_KEY,
        PLAID_ENV: PLAID_ENV,
    });
});

// app.post('/log_in', function(request, response, next) {
//     console.log('attempting login...');
//     var success = {
//         login: false
//     }
//     var username = request.body.username;
//     var password = request.body.password;
//
//     firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
//         var user = firebase.auth().currentUser;
//         // Grab individual user session token
//         user.getIdToken().then(function(token) {
//             success = {
//                 login: true,
//                 token: token,
//                 error: null
//             };
//             firebase.auth().signOut();
//             response.json(success);
//             console.log('successfully logged into Firebase');
//         }).catch(function(error) {
//             // Handle Errors here
//             var errorCode = error.code;
//             var errorMessage = error.message;
//             console.log('failed to create user: ' + errorMessage);
//             response.json({
//                 login: false,
//                 error: errorMessage
//             });
//         });
//     }, function() {
//         success = {
//             login: false
//         };
//         response.json(success);
//         console.log("login attempt to Firebase has failed");
//     });
// });
//
// app.post('/sign_up', function(request, response, next) {
//     console.log('attempting sign up...');
//
//     // gets object to database service
//     var database = firebase.database();
//     var username = request.body.username;
//     var password = request.body.password;
//     var promise = firebase.auth().createUserWithEmailAndPassword(username, password).then(function() {
//         // grabs admin session token
//         var user = firebase.auth().currentUser;
//         user.getIdToken().then(function(token) {
//             for (var key in buckets.nameBuckets) {
//                 admin.database().ref("users/" + user.uid + "/bucketNames/" + key).set({'name': buckets.nameBuckets[key]}).catch(
//                     console.log("error with names")
//                 );
//             }
//             response.json({
//                 login: true,
//                 token: token,
//                 userId: user.uid,
//                 error: null
//             });
//             firebase.auth().signOut();
//             console.log('successfully created user in Firebase: ' + user.uid);
//         }).catch(function(error) {
//             // Handle Errors here.
//             user.delete();
//             firebase.auth().signOut();
//             var errorCode = error.code;
//             var errorMessage = error.message;
//             console.log('failed to create user in Firebase: ' + errorMessage);
//             return response.json({
//                 login: false,
//                 error: errorMessage
//             });
//         });
//     }).catch(function(error) {
//         // Handle Errors here.
//         var errorCode = error.code;
//         var errorMessage = error.message;
//         console.log('failed to create user in Firebase: ' + errorMessage);
//         response.json({
//             login: false,
//             error: errorMessage
//         });
//     });
//     promise.catch(e => console.log(e.message));
// });

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(request, response, next) {
    // console.log("validating token: " + request.body.token);
    var token = request.body.token;

    if (token) {
        admin.auth().verifyIdToken(token).then(function(decodedToken) {
            console.log('verified Firebase token and now looking for Plaid tokens...');
            // grabs Plaid access token
            admin.database().ref('/users/' + decodedToken.uid + '/accounts').once('value', function(snapshot) {
                request.body.accessTokens = [];
                for (var key in snapshot.val()) {
                    var item = snapshot.val()[key];
                    if (item['user_token']) {
                        request.body.accessTokens.push(item['user_token']);
                        console.log('found existing Plaid token: ' + request.body.accessTokens);
                    }
                    request.body.userId = decodedToken.uid;

                    console.log("verified Firebase token for " + request.body.userId);
                    next();
                }
            });
        }).catch(function(error) {
            console.log('failed to authenticate token.');
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

//BUCKET FUNCTIONALITIES HERE ...
app.post('/reset_bucket_names', function(request, response, next) {
    console.log('called /reset_bucket_names');
    for (var key in buckets.nameBuckets) {
        admin.database().ref("users/" + request.body.userId + "/bucketNames/" + key).set({
            'name': buckets.nameBuckets[key]
        }).catch(function(error) {
            var errorMessage = error.message;
            console.log('failed to call /reset_bucket_names: ' + errorMessage);
            response.json({
                error: error,
                error: errorMessage
            });
        });
    };
});

apiRoutes.post('/transactions_for_bucket',function(request,response,next){
    console.log("Grabbing Transactions")
    var user_id = request.body.userId
    var bucket=request.body.which_bucket
    var bucket_path = 'users/'+user_id+'/bucketTransactions/'+bucket

    admin.database().ref(bucket_path).once('value').then(function(snapshot) {
        console.log("transactions_for_bucket called")
        var bucket_transactions = snapshot.val();
        // console.log(bucket_transactions)

        response.json(bucket_transactions);
    }).catch(function(error) {
        var errorMessage = error.message;
        console.log('failed to call bucketInfo: ' + errorMessage);
        response.json({
            error: error,
            error: errorMessage
        });
    });
});

apiRoutes.post('/rename_bucket',function(request,response,next){
    console.log("RECEIVED")
    var user_id = request.body.userId
    var bucket = request.body.which_bucket
    var new_name = request.body.new_name
    console.log(request.body.token)
    console.log(bucket)
    console.log("USER ID IS: "+user_id)
    var bucket_path = 'users/'+user_id+'/bucketNames/' + bucket
    admin.database().ref(bucket_path).update({name: new_name});
    // buckets.renameBucket(bucket_path, new_name)
});

apiRoutes.post('/bucket_names',function(request,response,next){
    console.log("RECIEVED")
    var user_id = request.body.userId
    var bucket=request.body.which_bucket
    //console.log(request.body.token)
    console.log(bucket)
    console.log("USER ID IS :"+user_id)

    admin.database().ref('users/' + request.body.userId + '/bucketNames').once('value', function(snapshot) {

        console.log( "INSIDE NAMES IN INDEX.JS SENDING SNAPSHOT")
        //console.log(snapshot.val());
        response.json(snapshot.val());
    });
});

apiRoutes.post('/change_bucket_size',function(request,response,next){
    console.log("RECEIVED")
    var user_id = request.body.userId
    var from_bucket=request.body.from_bucket
    var to_bucket=request.body.to_bucket
    var amount=request.body.amount
    //console.log(request.body.token)
    var from_bucket_path='users/'+user_id+'/bucketMoney/Spending Buckets/'+from_bucket
    var to_bucket_path='users/'+user_id+'/bucketMoney/Spending Buckets/'+to_bucket
    buckets.changeBucketsize(from_bucket_path,to_bucket_path,amount)
});


apiRoutes.post('/get_access_token', function(request, response, next) {
    // We HAVE to store the access token, so that Plaid does not think the
    // user is a new user logging in each time and create duplicate transactions
    console.log('getting access token...');

    app.set('public token', request.body.publicToken);
    plaidClient.exchangePublicToken(app.get('public token'), function(error, tokenResponse) {
        if (error != null) {
          var msg = 'Could not exchange public token!';
          console.log(msg + '\n' + error);
          return response.json({
            error: msg
          });
        }

        console.log('loading Access Token: ' + tokenResponse.access_token);
        admin.database().ref('users/' + request.body.userId + '/accounts/' + tokenResponse.item_id).set({
            user_token: tokenResponse.access_token
        });

        response.json({
          'error': false
        });

        updateAccounts(tokenResponse.accessToken, request.body.userId, () => {});
        updateTransactions(SIX_MONTHS, tokenResponse.accessToken, request.body.userId, () => {});
    });
});

apiRoutes.post('/accounts', function(request, response, next) {
    // Retrieve high-level account information and account and routing numbers
    // for each account associated with the Item.
    console.log('/accounts called')
    updateAllAccounts(request.body.accessTokens, request.body.userId).then(console.log("done"));
});

apiRoutes.post('/transactions', function(request, response, next) {
    // Pull transactions for the Item for the last 30 days to the front-end
    updateTransactions(SIX_MONTHS, request.body.accessTokens, request.body.userId, function(postData) {
        response.json(postData);
    });
});

apiRoutes.post('/savings', function(request, response, next) {
    // for (var key in buckets.nameBuckets) {
    //     admin.database().ref("users/" + request.body.userId + "/bucketNames/" + key).set({'name': buckets.nameBuckets[key]}).catch(
    //         console.log("error with names")
    //     );
    // }

    plaidClient.getAuth(request.body.accessToken, function(error, authResponse) {
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
                // console.log(savingsAccount);
            }
        }

        admin.database().ref('users/' + request.body.userId + '/bucketMoney').once('value', function(snapshot) {
            var savingsTotal = 0;
            for (var bucketClass in snapshot.val()) {
                if (bucketClass != "Savings Buckets" && bucketClass != "Income Buckets" ) {
                    for (var bucketName in snapshot.val()[bucketClass]) {
                        // console.log("savingsTotal: " + bucketName + " " +
                        //     snapshot.val()[bucketClass][bucketName]['Total']);
                        savingsTotal += parseInt(snapshot.val()[bucketClass][bucketName]['Total']);
                    }
                }
            }
            // console.log(savingsTotal * request.body.months);
            var postData = {
                'Savings': savingsAccount,
                'Total': savingsTotal * request.body.months
            };
            admin.database().ref('users/' + request.body.userId + '/bucketSavings/').set(postData);
            response.json(postData);
        });
    });
});

apiRoutes.post('/buckets', function(request, response, next) {
    updateTransactions(SIX_MONTHS, request.body.accessTokens, request.body.userId, function() {
        admin.database().ref('users/' + request.body.userId + '/bucketMoney').once('value', function(snapshot) {
            var bucketMoney = snapshot.val();
            admin.database().ref('users/' + request.body.userId + '/accounts').once('value', function(snapshot) {
                var accounts = snapshot.val();
                console.log( 'INSIDE BUCKETS IN INDEX.JS SENDING SNAPSHOT');
                console.log(snapshot.val());
                response.json({
                    'bucketMoney': bucketMoney,
                    'accounts': accounts
                });
            });
        });
    });
});

function updateAllAccounts(accessToken, userId) {
    return arr.reduce(function(promise, accessToken) {
        return promise.then(function() {
            return updateAccount(accessToken, userId, () => {});
        });
    }, Promise.resolve());
}

function updateAccount(accessToken, userId, jsonFunction) {
    plaidClient.getItem(accessToken, function(error, itemResponse) {
        if (error != null) {
            console.log(error);
            return {
                error: error
            };
        }
        var item = itemResponse.item;
        console.log('getItem');

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
            console.log('getInstitutionById');

            plaidClient.getAuth(accessToken, function(error, authResponse) {
                if (error != null) {
                    var msg = 'Unable to pull accounts from the Plaid API.';
                    console.log(msg + '\n' + error);
                    return {
                        error: msg
                    };
                }

                console.log("getAuth: " + authResponse.accounts);
                // [object Object],[object Object],[object Object],[object Object]
                // These are the different checking/cc banking accounts

                // Admin section for updating account info on Firebase
                var postData = {
                    'accounts': authResponse.accounts,
                    'institution': institution
                };
                admin.database().ref('users/' + userId + '/accounts/' + item).update(postData);
                console.log('posted item for: ' + userId);
            });
        });
    });
}

function updateTransactions(timePeriod, accessTokens, userId, callbackFunction) {
    var startDate = moment().subtract(timePeriod, 'months').format('YYYY-MM-DD');
    var endDate = moment().format('YYYY-MM-DD');
    var updatedTransactions = 'transactions are working';

    var thisMonth = new Date(endDate.substr(0, 4), endDate.substr(5, 2), '01');
    var startMonth = startDate.substr(0,8) + '01';

    plaidClient.getTransactions(accessToken, startMonth, endDate, {
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
        // Sam: Begin admin section for updating transaction data

        // console.log(bucketTotal);
        transactionsResponse.transactions.forEach(function(transaction) {
            var bucketSelect = buckets.selectBucket(transaction);
            var bucketName = bucketSelect['bucketName'];
            var bucketClass = bucketSelect['bucketClass'];
            var newPostKey = transaction.transaction_id;
            var postData = {};

            transaction.bucket = bucketName;
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
                bucketTotal[bucketName] += transaction.amount;
            }
        });

        admin.database().ref('users/' + userId + '/').once('value', function(snapshot) {
            if (snapshot.val()["lastEstimateUpdate"] && snapshot.val()["bucketMoney"]) {
                if (thisMonth <= Date.parse(snapshot.val()["lastEstimateUpdate"]["Month"])){
                    return;
                }
            }
            console.log('updated bucket totals for this month:');
            console.log(bucketTotal);

            var allBucketData = {
                "Spending Buckets": {},
                "Fixed Buckets": {},
                "Income Buckets": {}
            }
            for (var bucket in bucketSpending) {
                if (!isNaN(bucketTotal[bucket])) {
                   // console.log("updateTransactions for " + bucket + ": " + bucketTotal[bucket] + "/" + timePeriod);
                   allBucketData["Spending Buckets"][bucket] = {
                            Spending: bucketSpending[bucket],
                            Total: bucketTotal[bucket]/timePeriod
                        };
                }
                // bucketSavings += allBucketData["Spending Buckets"][bucket][Total];
            }
            for (var bucket in bucketFixed) {
                if (!isNaN(bucketTotal[bucket])) {
                    allBucketData["Fixed Buckets"][bucket] = {
                            Spending: bucketFixed[bucket],
                            Total: bucketTotal[bucket]/timePeriod
                        };
                }
                // bucketSavings += allBucketData["Fixed Buckets"][bucket][Total];
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
            console.log("updated bucket estimates: " );
        });

        callbackFunction(transactionsResponse);

        console.log('saved ' + transactionsResponse.transactions.length + ' transactions under ' + userId);
    });
}

app.use('/', apiRoutes);

var server = app.listen(APP_PORT, function() {
  console.log('plaid-walkthrough server listening on port ' + APP_PORT);
});
