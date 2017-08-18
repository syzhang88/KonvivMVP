var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

exports.getInsights=function getInsights(path_check,current_month_path,last_month_path,user_id){
    console.log(path_check)
    console.log(current_month_path)
    console.log(last_month_path)
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
            var day_of_month=15
            var day
            var current_date='2017-08-15'
            var last_month_date='2017-07-15'
            var current_month = firebase.database().ref(current_month_path);
            var last_month = firebase.database().ref(last_month_path);
            admin.database().ref(current_month_path).once('value').then(function(snapshot) {
                var bucket_transactions = snapshot.val();
                //console.log(bucket_transactions)
                //return bucket_transactions
                //console.log("THIS MONTH")
                for (var key in bucket_transactions){
                    if(bucket_transactions.hasOwnProperty(key)){
                        //console.log('Transaction Date: '+bucket_transactions[key]['date'])
                        date=bucket_transactions[key]['date']
                        day=parseInt(date.slice(8,9))
                        if (day<day_of_month){
                            //console.log(bucket_transactions[key]['amount'])
                            this_month_amount=this_month_amount+bucket_transactions[key]['amount']
                        }

                    }
                }

                admin.database().ref(last_month_path).once('value').then(function(snapshot) {
                    var bucket_transactions = snapshot.val();
                    //console.log(bucket_transactions)
                    //return bucket_transactions
                    //console.log("PREVIOUS MONTH")
                    for (var key in bucket_transactions){
                        if(bucket_transactions.hasOwnProperty(key)){
                            //console.log('Transaction Date: '+bucket_transactions[key]['date'])
                            date=bucket_transactions[key]['date']
                            //day=date.slice(8,10)
                            day=parseInt(date.slice(8,10))
                            //console.log(date)
                            //console.log(day)
                            if (day<day_of_month){
                                //console.log(bucket_transactions[key]['amount'])
                                last_month_amount=last_month_amount+bucket_transactions[key]['amount']
                            }

                        }
                    }
                    console.log(this_month_amount)
                    console.log(last_month_amount)
                    diff=this_month_amount-last_month_amount
                    var result_one
                    if (diff<0){
                        console.log("YOU SAVED $"+diff.toFixed(2)+" THIS MONTH")
                        result_one="As of today, you’ve spent $" + (-1*diff).toFixed(2) + " less than at this point last month for Eating Out."

                    }
                    else{
                        console.log("YOU SPENT $"+diff.toFixed(2)+" MORE THIS MONTH")
                        result_one="As of today, you’ve spent $" + diff.toFixed(2) + " less than at this point last month for Eating Out."
                    }
                    //SAVE INSIGHT --1 ON FIREBASE
                    ref.update({
                        First_Insight: result_one
                    });

                })
            })


            // CREATE INSIGHT -- 2
            var num_of_transactions=0
            var transaction_path='users/'+user_id+'/bucketTransactions'
            admin.database().ref(transaction_path).once('value').then(function(snapshot) {
                var buckets = snapshot.val();
                //console.log(buckets)
                //return bucket_transactions
                for (var category in buckets){
                    //console.log(category)
                    if(buckets.hasOwnProperty(category)){
                        //console.log(buckets[category]['2017-08'])
                        transactions=buckets[category]['2017-08']
                        for (var trans in transactions){
                            //console.log(buckets[category]['2017-08'][trans]['amount'])
                            if (buckets[category]['2017-08'][trans]['amount']>100){
                                num_of_transactions=num_of_transactions+1
                            }
                        }
                    }
                }
                console.log("The number of transactions above $100 is "+num_of_transactions)
                var result_two = "There are " +num_of_transactions + " transactions this month that were over $100.00."
                //SAVE INSIGHT --2 ON FIREBASE
                ref.update({
                        Second_Insight: result_two
                    });
            })

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
                        console.log(category)
                        //console.log(fixed_buckets[category]['2017-08'])
                        total_spending=total_spending+fixed_buckets[category]['Spending']
                    }
                }
                console.log("FIXED "+total_spending)
                admin.database().ref(spending_buckets_path).once('value').then(function(snapshot) {
                    var spending_buckets = snapshot.val();
                    //console.log(spending_buckets)
                    //return bucket_transactions
                    for (var category in spending_buckets){
                        if(spending_buckets.hasOwnProperty(category)){
                            console.log(category)
                            //console.log(spending_buckets[category]['2017-08'])
                            total_spending=total_spending+spending_buckets[category]['Spending']
                        }
                    }
                console.log("FIXED+SPENDING "+total_spending)
                var spending_per_day = total_spending/day_of_month
                console.log("This month, you’ve spent $" + total_spending.toFixed(2) + " so far, which is an average of $" + spending_per_day.toFixed(2) + " per day.")
                var result_three = "This month, you’ve spent $" + total_spending.toFixed(2) + " so far, which is an average of $" + spending_per_day.toFixed(2) + " per day."

                //SAVE INSIGHT --3 ON FIREBASE
                ref.update({
                        Third_Insight: result_three
                    });
                })
            })

            //CREATE INSIGHT -- 4
            var total_spending=0
            var food_spending=0
            var spending_buckets_path='users/'+user_id+'/bucketMoney/Spending Buckets'
            admin.database().ref(spending_buckets_path).once('value').then(function(snapshot) {
                var spending_buckets = snapshot.val();
                //console.log(fixed_buckets)
                for (var category in spending_buckets){
                    if(spending_buckets.hasOwnProperty(category)){
                        console.log(category)
                        if(category==='Other Spending'){
                            continue;
                        }
                        if(category==='Eating Out'){
                            food_spending=spending_buckets[category]['Spending']
                        }
                        total_spending=total_spending+spending_buckets[category]['Spending']
                    }
                }
                console.log(total_spending)
                console.log(food_spending)
                var percent_food_spending = (food_spending/total_spending)*100
                if (percent_food_spending>=25){
                    var result_four = "You’re a total foodie! Did you know that " + percent_food_spending + "% of your income goes to eating out"
                //SAVE INSIGHT --4 ON FIREBASE
                    ref.update({
                            Fourth_Insight: result_four
                        });
                }
            })
        }
    });
}
