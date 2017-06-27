var firebase = require("firebase");

// const ESTIMATION_PERIOD = 180;
const MONTH_PERIOD = 31;


var userBuckets = {}
// Maps transaction names to user-selected buckets

var mostRecentBucket = {}
//Maps transaction names to the bucket the user most recently selected


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

exports.editBucket = function editBucket (transaction, newBucket) {
    if (selectBucket(transaction) != newBuckets) {
        if (mostRecentBucket[transaction.name] == newBucket) {
            userBuckets[transaction.name] = newBucket;
        } else {
            mostRecentBucket[transaction.name] = newBucket;
        }
    }
};


exports.selectBucket = function selectBucket (transaction) {
    // console.log('New Selection:');
    var bucket = 'General Spending';
    if (transaction.amount < 0) {
        return 'Income';
    }
    if (userBuckets[transaction.name]) {
        return userBuckets[transaction.name];
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

exports.sizeBuckets = function sizeBuckets (transactions, bucketsList, estimationPeriod) {
    // var bucketAmounts = {
    //     'Groceries': 0,
    //     'Eating Out': 0,
    //     'Transportation': 0,
    //     'Transportation': 0,
    //     'Transportation': 0,
    //     'Entertainment': 0,
    //     'Entertainment': 0,
    //     'Shopping': 0,
    //     'Bills': 0,
    //     'Subscriptions': 0
    // };

    var userId = firebase.auth().currentUser.uid;

    for (bucket in bucketsList) {
        firebase.database().ref('/users/' + userId + '/' + bucket).then(function(snapshot) {
            var totalAmount = 0;
            for (var key in snapshot.val()) {
                for (var amount of snapshot.val()[key]['amount']) {
                    totalAmount += amount;
                }
            }
            var monthlyAmount = totalAmount/estimationPeriod * MONTH_PERIOD;
            bucketsList[bucket] = monthlyAmount;
        });
    }
    return bucketsList
}
