var firebase = require("firebase");

const MONTH_PERIOD = 30;

// Hashtable that maps transaction name to the bucket the user most recently reclassified for it
var trackReclassifications = {}

var reclassifiedTransactions = {}

var predefinedBuckets = {
    'Supermarkets and Groceries': 'Groceries',
    'Food and Drink': 'Eating Out',
    'Travel': 'Transportation',
    'Automotive': 'Transportation',
    'Transportation': 'Transportation',
    'Recreation': 'Entertainment',
    'Personal': 'Entertainment',
    'Shops': 'Shopping',
    'Utilities': 'Bills',
    'Subscription': 'Subscriptions'
};

var nameBuckets = {
    'Groceries': 'Groceries',
    'Eating Out': 'Eating Out',
    'Transportation': 'Transportation',
    'Entertainment': 'Entertainment',
    'Shopping': 'Shopping',
    'Bills': 'Bills',
    'Subscriptions': 'Subscriptions',
    'Income': 'Income',
    'General Spending': 'General Spending'
}

var bucketAmountsOriginal = {
    'Groceries': 0,
    'Eating Out': 0,
    'Transportation': 0,
    'Entertainment': 0,
    'Shopping': 0,
    'Bills': 0,
    'Subscriptions': 0,
    'Income': 0,
    'General Spending': 0
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

exports.bucketAmounts = clone(bucketAmountsOriginal);

// Deprecated
// Classifies which buckets transactions on a list of transactions belongs to
exports.selectBuckets = function selectBuckets (transactions) {
    // console.log('New Selection:');
    buckets = {};

    for (transaction in transactions) {
        var bucket = selectBucket(transaction);
        var newPostKey = transaction.transaction_id;
        var postData = {}
        postData[newPostKey] = transaction;
        buckets[bucket] = postData
    };
    return buckets;
}

// Classifies which bucket a certain transaction belongs to
exports.selectBucket = function selectBucket (transaction) {
    // console.log('New Selection:');
    var bucket = 'General Spending';
    if (transaction.amount < 0) {
        return 'Income';
    }
    if (reclassifiedTransactions[transaction.name]) {
        return reclassifiedTransactions[transaction.name];
    }
    if (transaction.category ==  null) {
        return 'General Spending';
    }
    for (i = 0; i < transaction.category.length; i++) {
        var category = transaction.category[i] ;
        // console.log(category);
        if (predefinedBuckets[category]) {
            bucket = predefinedBuckets[category];
        }
    }
    return bucket
}

// Estimates the size of a bucket given transactions from a given interval of
// days, which is passed in as estimationPeriod

exports.estimateSize = function estimateSize (transactions, estimationPeriod, totalBalance) {
    console.log("calculating buckets sizes now...");

    var bucketAmounts = clone(bucketAmountsOriginal);

    var monthlyTotal = 0;
    for (var bucket in bucketAmounts) {
        var totalBucketAmount = 0;
        // console.log("Bucket " + bucket + " calculating now...")
        for (var key in transactions[bucket]) {
            if (transactions[bucket][key]) {
                var amount = transactions[bucket][key]['amount'];
                // console.log("Bucket " + bucket + ": + amount " + amount);
                totalBucketAmount += amount;
                // console.log("Bucket " + bucket + ": " + totalBucketAmount);
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

    bucketAmounts['General Spending'] = {'Total': generalBucket,
        'Spending': 0, 'Name': nameBuckets['General Spending']};

    console.log('finished calculating bucket estimations... ');
    console.log(bucketAmounts);

    return bucketAmounts;
}

/*** REMAINING FUNCTIONS HAVE NOT BEEN TESTED AND MAY BE BUGGY ***/

// If the bucket the user is moving this transaction to matches the last
// bucket the user moved a transaction with this name to (i.e., the user
// moves transactions with the same name to the same bucket twice in a row),
// automatically store that bucket in reclassifiedTransactions to categorize all
// transactions sharing this name to that bucket in the future.
function reclassification (transaction, oldBucket, newBucket) {
    if (oldBucket != newBuckets) {
        if (trackReclassifications[transaction.name] == newBucket) {
            reclassifiedTransactions[transaction.name] = newBucket;
        } else {
            trackReclassifications[transaction.name] = newBucket;
        }
    }
};

// oldDbPath and newDbPath each are firebase.database().ref('...')
// oldDbPath and newDbPath are manually entered because of abstraction, to
// simplify modifying firebase structure
exports.moveTransaction = function moveTransaction (transaction, oldBucketPath, newBucketPath, path) {
    // Check if bucket is real
    var names = Object.keys(nameBuckets);
    if (names.indexOf(oldBucket) < 0 || names.indexOf(newBucket) < 0 ) throw "not a bucket";

    reclassification(transaction, oldBucket, newBucket);
    var newPostKey = transaction.transaction_id;
    var postData = {}

    postData[newPostKey] = transaction;

    //add transaction to new bucket
    firebase.database().ref(path + newBucket).update(postData);

    //delete transaction from old bucket
    firebase.database().ref(path + oldBucket).remove(postData);
}

// moveMoney returns false IF you subtract more money from a bucket than you
// have remaining in it
exports.moveMoney = function moveMoney (amount, oldBucketPath, newBucketPath) {
    var newPostKey = transaction.transaction_id;
    var oldBucket = {}
    var newBucket = {}

    //subtract from this bucket
    firebase.database().ref(oldBucketPath).once('value').then(function(snapshot) {
        if (snapshot.val()['Remaining'] - amount > 0) {
            oldBucket['Remaining'] = snapshot.val()['Remaining'] - amount;
            oldBucket['Total'] = snapshot.val()['Total'] - amount;
        } else {
            return false;
        }
    });
    firebase.database().ref(oldBucketPath).update(oldBucket);

    //add to that bucket
    firebase.database().ref(newBucketPath).once('value').then(function(snapshot) {
        newBucket['Remaining'] = snapshot.val()['Remaining'] + amount;
        newBucket['Total'] = snapshot.val()['Total'] + amount;
    });
    firebase.database().ref(newBucketPath).update(newBucket);

    return true;
}

// Each bucket has a key named 'Name' in its hashtable (dictionary) underneath
// the branch /bucketMoney on Firebase. You can change this name here
exports.renameBucket = function renameBucket (newName, oldName) {
    for (var key in nameBuckets) {
        if (nameBuckets[key] == oldName) {
            nameBuckets[key] = newName;
            console.log('bucket ' + oldName + ' has been named ' + newName);
        }
    }
}
