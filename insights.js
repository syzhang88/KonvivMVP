var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

const MONTH_PERIOD = 30;

// Hashtable that maps transaction name to the bucket the user most recently reclassified for it
var trackReclassifications = {}

var reclassifiedTransactions = {}

var spendingBuckets = {
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

var fixedBuckets = {
    'Rent': 'Housing',
    'Loan and Mortgages': 'Housing',
    'Subscription': 'Subscriptions',
    'Insurance': 'Insurance',
    'Loan': 'Loans'
}

var nameBuckets = {
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

var incomeAmounts = {
    'Income': 0
};

var fixedAmounts = {
    'Housing': 0,
    'Subscriptions': 0,
    'Insurance': 0,
    'Loans': 0,
};

var spendingAmounts = {
    'Groceries': 0,
    'Eating Out': 0,
    'Transportation': 0,
    'Entertainment': 0,
    'Shopping': 0,
    'Variable Bills': 0,
    'Other Spending': 0
};

var allAmounts = {
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
    var bucket = {
        bucketName: 'Other Spending',
        bucketClass: 'Spending'
    };
    // if (reclassifiedTransactions[transaction.name]) {
    //     return reclassifiedTransactions[transaction.name];
    // }
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
        // console.log(category);
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

// Deprecated
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

    bucketAmounts['Other Spending'] = {'Total': generalBucket,
        'Spending': 0, 'Name': nameBuckets['Other Spending']};

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
/*exports.moveTransaction = function moveTransaction (transaction, oldBucketPath, newBucketPath, path) {
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
}*/

exports.moveTransaction = function moveTransaction (oldBucketPath, newBucketPath) {
    // Check if bucket is real 
    oldPath=admin.database().ref(oldBucketPath)
    newPath=admin.database().ref(newBucketPath)
    console.log("HERE")
    
    oldPath.once('value', function(snap)  {
        newPath.update(snap.val(), function(error) {
            if( !error ) {
                oldPath.remove(); 
            }
            else if( typeof(console) !== 'undefined' && console.error ) {  
                console.error(error); 
            }
        });
    });
    console.log("DONE")    
        /*oldPath.once('value').then(snap => {
            newPath.update(snap.val());
        }).then(() => {
            oldPath.remove();
        }).then(() => {
           console.log('Done!');
        })*/
}


// moveMoney returns false IF you subtract more money from a bucket than you
// have remaining in it
exports.changeBucketsize = function changeBucketsize (from_bucket_path,to_bucket_path,amount) {
    var oldBucket = {}
    var newBucket = {}
    console.log("NOW HERE")
    //subtract from this bucket
    admin.database().ref(from_bucket_path).once('value').then(function(snapshot) {
        console.log(amount)
        console.log(snapshot.val()['Total'])
        if (snapshot.val()['Total'] - amount >=0) {
            oldBucket['Total'] = snapshot.val()['Total'] - amount;
        } else {
            console.log("Not Enough Money in the Bucket")
            return false;
        }
        console.log(oldBucket['Total'])
        console.log("YOOOOOO!!!")
        admin.database().ref(from_bucket_path).update(oldBucket);

    //add to that bucket
        admin.database().ref(to_bucket_path).once('value').then(function(snapshot) {
            console.log(amount)
            console.log(snapshot.val()['Total'])
            newBucket['Total'] = parseFloat(snapshot.val()['Total']) +parseFloat(amount);
            console.log(newBucket['Total'])
            admin.database().ref(to_bucket_path).update(newBucket);

        });
    });

    return true;
}

// Each bucket has a key named 'Name' in its hashtable (dictionary) underneath
// the branch /bucketMoney on Firebase. You can change this name here
exports.renameBucket = function renameBucket (path, newName) {
     var db=admin.database()
     var ref=db.ref(path)
     ref.update({
        "Name":newName
    })
}

exports.bucketInfo = function bucketInfo(bucketpath){
    admin.database().ref(bucketpath).once('value').then(function(snapshot) {
        console.log("Bucket Info called")
        var bucket_transactions = snapshot.val();
        console.log(bucket_transactions)

        return bucket_transactions
        // for (var key in bucket_transactions){
        //     if(bucket_transactions.hasOwnProperty(key)){
        //         return
        //         console.log('Transaction Name: '+bucket_transactions[key]['name'])
        //         console.log('Amount: '+bucket_transactions[key]['amount'])
        //         console.log('Date: '+bucket_transactions[key]['date'])
        //     }
        // }
    }).catch(function(error) {
        var errorMessage = error.message;
        console.log('failed to call bucketInfo: ' + errorMessage);
        return {
            error: error,
            error: errorMessage
        };
    });
};
