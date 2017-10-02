var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

const MONTH_PERIOD = 30;

// Hashtable that maps transaction name to the bucket the user most recently reclassified for it
var trackReclassifications = {}

var reclassifiedTransactions = {}

var spendingBuckets = {                                 //DICTIONARY MAPPING PLAID CATEGORIES (on left) TO KONVIV CATEGORIES (on right)
    'Supermarkets and Groceries': 'Groceries',
    'Food and Drink': 'Eating Out',
    'Travel': 'Transportation',
    'Automotive': 'Transportation',
    'Transportation': 'Transportation',
    'Recreation': 'Entertainment',
    'Personal': 'Entertainment',
    'Shops': 'Shopping',
    'Utilities': 'Variable Bills',
    'Subscription': 'Subscriptions'
};

var fixedBuckets = {                                    //DICTIONARY MAPPING PLAID CATEGORIES (on left) TO KONVIV CATEGORIES (on right)
    'Rent': 'Housing',
    'Loan and Mortgages': 'Housing',
    'Subscription': 'Subscriptions',
    'Insurance': 'Insurance',
    'Loan': 'Loans'
}

var nameBuckets = {                                     //DEFAULT NAMES FOR BUCKETS
    'Groceries': 'Groceries',
    'Eating Out': 'Eating Out',
    'Transportation': 'Transportation',
    'Entertainment': 'Entertainment',
    'Shopping': 'Shopping',
    'Variable Bills': 'Variable Bills',
    'Subscriptions': 'Subscriptions',
    'Rent': 'Housing',
    'Insurance': 'Insurance',
    'Loans': 'Loans',
    'Housing': 'Housing',
    'Income': 'Income',
    'Other Spending': 'Other Spending'
}

var incomeAmounts = {                               //DEFAULT VALUES FOR INCOME BUCKET
    'Income': 0
};

var fixedAmounts = {                                //DEFAULT VALUES FOR FIXED BUCKETS
    'Housing': 0,
    'Subscriptions': 0,
    'Insurance': 0,
    'Loans': 0,
};

var spendingAmounts = {                             //DEFAULT VALUES FOR SPENDING BUCKETS
    'Groceries': 0,
    'Eating Out': 0,
    'Transportation': 0,
    'Entertainment': 0,
    'Shopping': 0,
    'Variable Bills': 0,
    'Other Spending': 0
};

var allAmounts = {                                  ////DEFAULT VALUES FOR ALL BUCKETS
    'Housing': 0,
    'Groceries': 0,
    'Eating Out': 0,
    'Transportation': 0,
    'Entertainment': 0,
    'Shopping': 0,
    'Variable Bills': 0,
    'Subscriptions': 0,
    'Insurance': 0,
    'Loans': 0,
    'Income': 0,
    'Other Spending': 0
};

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
}

exports.clone = clone;

exports.incomeAmounts = clone(incomeAmounts);

exports.fixedAmounts = clone(fixedAmounts);

exports.spendingAmounts = clone(spendingAmounts);

exports.allAmounts = clone(allAmounts);

exports.nameBuckets = nameBuckets;


// Classifies which bucket a certain transaction belongs to
exports.selectBucket = function selectBucket (transaction) {
    var bucket = {
        bucketName: 'Other Spending',
        bucketClass: 'Spending'
    };

    if (transaction.amount < 0) {
        return {
            bucketName: 'Income',
            bucketClass: 'Income'
        };
    }
    if (transaction.category ==  null) {
        return {
            bucketName: 'Other Spending',
            bucketClass: 'Spending'
        };
    }
    for (i = 0; i < transaction.category.length; i++) {
        var category = transaction.category[i] ;
        if (fixedBuckets[category]) {
            bucket = {
                bucketName: fixedBuckets[category],
                bucketClass: 'Fixed'
            };
        } else if (spendingBuckets[category]) {
            bucket = {
                bucketName: spendingBuckets[category],
                bucketClass: 'Spending'
            };
        }
    }
    return bucket
}

// Estimates the size of a bucket given transactions from a given interval of days, which is passed in as estimationPeriod
exports.estimateSize = function estimateSize (transactions, estimationPeriod, totalBalance) {
    console.log("calculating buckets sizes now...");

    var bucketAmounts = clone(bucketAmountsOriginal);

    var monthlyTotal = 0;
    for (var bucket in bucketAmounts) {
        var totalBucketAmount = 0;
        for (var key in transactions[bucket]) {
            if (transactions[bucket][key]) {
                var amount = transactions[bucket][key]['amount'];
                totalBucketAmount += amount;
            }
        }
        var monthlyBucketAmount = totalBucketAmount/estimationPeriod * MONTH_PERIOD;

        bucketAmounts[bucket] = {'Total': monthlyBucketAmount,
            'Spending': 0, 'Name': nameBuckets[bucket]};
        if (bucket != "Income") {
            monthlyTotal += monthlyBucketAmount;
            console.log(bucket + ": " + monthlyBucketAmount);
        }
    }
    var generalBucket = totalBalance - monthlyTotal;
    console.log("Bucket General Bucket " + ": " + generalBucket);
    console.log("Total Balance " + ": " + totalBalance);

    bucketAmounts['Other Spending'] = {'Total': generalBucket,
        'Spending': 0, 'Name': nameBuckets['Other Spending']};

    console.log('finished calculating bucket estimations... ');
    console.log(bucketAmounts);

    return bucketAmounts;
}

// MOVE A TRANSACTION FROM ONE BUCKET TO ANOTHER
exports.moveTransaction = function moveTransaction (oldBucketPath, newBucketPath) {
    oldPath=admin.database().ref(oldBucketPath)
    newPath=admin.database().ref(newBucketPath)
    oldPath.once('value', function(snap)  {
        newPath.update(snap.val(), function(error) {
            if( !error ) {
                oldPath.remove();
            }
            else if( typeof(console) !== 'undefined' && console.error ) {
                console.error(error);
            }
        });
    }).catch;
}

// CHANGE SIZE OF THE BUCKET. ADD/SUBTRACT SOME AMOUNT OF MONEY FROM ONE BUCKET AND SUBTRACT/ADD THAT AMOUNT TO ANOTHER BUCKET
exports.changeBucketsize = function changeBucketsize (fromBucketPath, amount) {
    var oldBucket = {}
    var newBucket = {}
    //subtract from this bucket
    admin.database().ref(fromBucketPath).once('value').then(function(snapshot) {
        console.log(amount)
        console.log(snapshot.val()['Total'])
        if (parseInt(snapshot.val()['Total']) + parseInt(amount) >=0) {
            oldBucket['Total'] = parseInt(snapshot.val()['Total']) + parseInt(amount);
        } else {
            console.log("Not Enough Money in the Bucket");
            return {
                error: new Error("Not Enough Money in the Bucket"),
                message: "Not Enough Money in the Bucket"
            };
        }
        admin.database().ref(fromBucketPath).update(oldBucket);
  });
    return true;
}

// Each bucket has a key named 'Name' in its hashtable (dictionary) underneath
// the branch /bucketMoney on Firebase. You can change this name here
exports.renameBucket = function renameBucket (path, newName) {
     var db = admin.database()
     var ref = db.ref(path)
     ref.update({
        "Name":newName
    })
}

// GET ALL THE TRANSACTIONS FOR THAT BUCKET
exports.bucketInfo = function bucketInfo(bucketPath){
    admin.database().ref(bucketPath).once('value').then(function(snapshot) {
        console.log("Bucket Info called")
        var bucketTransactions = snapshot.val();
        console.log(bucketTransactions)
        return bucketTransactions
    }).catch(function(error) {
        var errorMessage = error.message;
        console.log('failed to call bucketInfo: ' + errorMessage);
        return {
            error: error,
            error: errorMessage
        };
    });
};
