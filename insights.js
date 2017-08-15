var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

exports.getInsights=function getInsights(path_check,current_month_path,last_month_path,user_id){
    console.log(path_check)
    var ref = admin.database().ref(path_check);
    ref.once("value").then(function(snapshot) {
        if (snapshot.exists()===true){
            console.log("Insight section exists")
            //SHOW INSIGHTS
        }
        else{
            console.log("Create Insight section")
            //CREATE INSIGHT -- 1
            var this_month_amount=0
            var last_month_amount=0
            var day_of_month=14
            var day
            var current_date='2017-08-14'
            var last_month_date='2017-07-14'
            var current_month = firebase.database().ref(current_month_path);
            var last_month = firebase.database().ref(last_month_path);
            admin.database().ref(current_month_path).once('value').then(function(snapshot) {
                var bucket_transactions = snapshot.val();
                //console.log(bucket_transactions)
                //return bucket_transactions
                for (var key in bucket_transactions){
                    if(bucket_transactions.hasOwnProperty(key)){
                        //console.log('Transaction Date: '+bucket_transactions[key]['date'])
                        date=bucket_transactions[key]['date']
                        day=parseInt(date.slice(8,9))
                        if (day<day_of_month){
                            this_month_amount=this_month_amount+bucket_transactions[key]['amount']
                        }
                        
                    }
                }
            })

            admin.database().ref(last_month_path).once('value').then(function(snapshot) {
                var bucket_transactions = snapshot.val();
                //console.log(bucket_transactions)
                //return bucket_transactions
                for (var key in bucket_transactions){
                    if(bucket_transactions.hasOwnProperty(key)){
                        //console.log('Transaction Date: '+bucket_transactions[key]['date'])
                        date=bucket_transactions[key]['date']
                        day=parseInt(date.slice(8,9))
                        if (day<day_of_month){
                            last_month_amount=last_month_amount+bucket_transactions[key]['amount']
                        }
                        
                    }
                }
            })
            diff=this_month_amount-last_month_amount
            if (diff<0){
                console.log("YOU SAVED $"+diff+" THIS MONTH")
            }
            else{
                console.log("YOU SPENT $"+diff+" MORE THIS MONTH")
            }

            // SAVE INSIGHT --1 ON FIREBASE 

            
            // CREATE INSIGHT -- 2
            var num_of_transactions=0
            var transaction_path='users/'+user_id+'/bucketTransactions'
            admin.database().ref(transaction_path).once('value').then(function(snapshot) {
                var buckets = snapshot.val();
                //console.log(buckets)
                //return bucket_transactions
                for (var category in buckets){
                    if(buckets.hasOwnProperty(category)){
                        //console.log(buckets[category]['2017-08'])
                        bucket_month=buckets[category]['2017-08']
                        for (var trans in bucket_month){
                            if (bucket_month['amount']>100){
                                num_of_transaction=num_of_transaction+1
                            }
                        }
                    }
                }
            })
            console.log("The number of transactions above $100 is "+num_of_transactions)
            
            //SAVE INSIGHT --2 ON FIREBASE

            
            //CREATE INSIGHT --3
            var total_spending=0
            var fixed_buckets_path='users/'+user_id+'/bucketMoney/Fixed Buckets'
            var spending_buckets_path='users/'+user_id+'/bucketMoney/Spending Buckets'
            admin.database().ref(fixed_buckets_path).once('value').then(function(snapshot) {
                var fixed_buckets = snapshot.val();
                //console.log(fixed_buckets)
                //return bucket_transactions
                for (var category in fixed_buckets){
                    if(fixed_buckets.hasOwnProperty(category)){
                        //console.log(fixed_buckets[category]['2017-08'])
                        total_spending=total_spending+fixed_buckets[category]['Spending']
                    }
                }
            })
            admin.database().ref(spending_buckets_path).once('value').then(function(snapshot) {
                var spending_buckets = snapshot.val();
                //console.log(spending_buckets)
                //return bucket_transactions
                for (var category in spending_buckets){
                    if(spending_buckets.hasOwnProperty(category)){
                        console.log(spending_buckets[category]['2017-08'])
                        total_spending=total_spending+spending_buckets[category]['Spending']
                    }
                }
            })
            var spending_per_day=total_spending/day_of_month
            console.log("You’ve spent $" + total_spending + " till today which is an average of $" + spending_per_day + " per day.")
            
            //SAVE INSIGHT --3 ON FIREBASE
        }
    });
}