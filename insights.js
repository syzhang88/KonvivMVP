var admin = require("firebase-admin");
var firebase = require("firebase");
var serviceAccount = require("./konvivandroid-firebase-adminsdk-re0l3-f09e6af5d7.json");

exports.getInsights=function getInsights(path_check,current_month_path,last_month_path,user_id){
    console.log(path_check)
    console.log(current_month_path)
    console.log(last_month_path)
    var ref = admin.database().ref(path_check);
    ref.once("value").then(function(snapshot) {
        if (snapshot.exists()===true){                      //CHECK IF THE "INSIGHT" SECTION EXIST IN FIREBASE
            console.log("Insight section exists")
        }
        else{
            console.log("Create Insight section")
            ref.update({
                    About:"Provides insights based on your spending"                //CREATE AN "INSIGHT" SECTION IN FIREBASE IF THE INSIGHT DOESN'T EXIST
            });
        }
            if(snapshot.hasChild("First_Insight")===false){                 //CHECK IF FIRST INSIGHT EXISTS
                //CREATE INSIGHT -- 1 -->     COMPARE SPENDING OF THIS MONTH TO LAST MONTH FOR THE SAME DATE
                var this_month_amount=0
                var last_month_amount=0
                var day_of_month=15
                var day
                var current_date=momene
                var last_month_date='2017-07-15'
                var current_month = firebase.database().ref(current_month_path);
                var last_month = firebase.database().ref(last_month_path);
                admin.database().ref(current_month_path).once('value').then(function(snapshot) {
                    var bucket_transactions = snapshot.val();
                    for (var key in bucket_transactions){
                        if(bucket_transactions.hasOwnProperty(key)){
                            date=bucket_transactions[key]['date']
                            day=parseInt(date.slice(8,9))
                            if (day<day_of_month){
                                this_month_amount=this_month_amount+bucket_transactions[key]['amount']
                            }

                        }
                    }
                    admin.database().ref(last_month_path).once('value').then(function(snapshot) {
                        var bucket_transactions = snapshot.val();
                        for (var key in bucket_transactions){
                            if(bucket_transactions.hasOwnProperty(key)){
                                date=bucket_transactions[key]['date']
                                day=parseInt(date.slice(8,10))
                                if (day<day_of_month){
                                    last_month_amount=last_month_amount+bucket_transactions[key]['amount']
                                }

                            }
                        }
                        diff=this_month_amount-last_month_amount
                        var result_one
                        if (diff<0){
                            console.log("YOU SAVED $"+diff.toFixed(2)+" THIS MONTH")
                            result_one="As of today, you’ve spent $" + (-1*diff).toFixed(2) + " less than at this date last month for Eating Out."

                        }
                        else{
                            console.log("YOU SPENT $"+diff.toFixed(2)+" MORE THIS MONTH")
                            result_one="As of today, you’ve spent $" + diff.toFixed(2) + " less than at this date last month for Eating Out."
                        }
                        //SAVE INSIGHT --1 ON FIREBASE
                        ref.update({
                            First_Insight: result_one
                        });

                    })
                })
            }

            if(snapshot.hasChild("Second_Insight")===false){                //CHECK IF SECOND INSIGHT EXISTS
                // CREATE INSIGHT -- 2 -->  CALCULATE THE NUMBER OF TRANSACTIONS OVER $100
                var num_of_transactions=0
                var transaction_path='users/'+user_id+'/bucketTransactions'
                admin.database().ref(transaction_path).once('value').then(function(snapshot) {
                    var buckets = snapshot.val();
                    for (var category in buckets){
                        if(buckets.hasOwnProperty(category)){
                            transactions=buckets[category]['2017-08']
                            for (var trans in transactions){
                                if (buckets[category]['2017-08'][trans]['amount']>100){
                                    num_of_transactions=num_of_transactions+1
                                }
                            }
                        }
                    }
                    console.log("The number of transactions above $100 is "+ num_of_transactions)
                    var result_two = "There are " + num_of_transactions.toFixed() + " transactions this month that were over $100.00."
                    //SAVE INSIGHT --2 ON FIREBASE
                    ref.update({
                            Second_Insight: result_two
                        });
                })
            }

            if(snapshot.hasChild("Third_Insight")===false){                     //CHECK IF THIRD INSIGHT EXISTS
                //CREATE INSIGHT --3  --> CALCULATE AVERAGE SPENDING PER DAY UPTO A CERTAIN DAY OF THAT MONTH
                var total_spending=0
                var fixed_buckets_path='users/'+user_id+'/bucketMoney/Fixed Buckets'
                var spending_buckets_path='users/'+user_id+'/bucketMoney/Spending Buckets'
                admin.database().ref(fixed_buckets_path).once('value').then(function(snapshot) {
                    var fixed_buckets = snapshot.val();
                    for (var category in fixed_buckets){
                        if(fixed_buckets.hasOwnProperty(category)){
                            console.log(category)
                            total_spending=total_spending+fixed_buckets[category]['Spending']
                        }
                    }
                    console.log("FIXED "+total_spending)
                    admin.database().ref(spending_buckets_path).once('value').then(function(snapshot) {
                        var day_of_month=15
                        var spending_buckets = snapshot.val();
                        for (var category in spending_buckets){
                            if(spending_buckets.hasOwnProperty(category)){
                                total_spending=total_spending+spending_buckets[category]['Spending']
                            }
                        }
                    var spending_per_day = total_spending/day_of_month
                    console.log("This month, you’ve spent $" + total_spending.toFixed(2) + " so far, which is an average of $" + spending_per_day.toFixed(2) + " per day.")
                    var result_three = "This month, you’ve spent $" + total_spending.toFixed(2) + " so far, which is an average of $" + spending_per_day.toFixed(2) + " per day."

                    //SAVE INSIGHT --3 ON FIREBASE
                    ref.update({
                            Third_Insight: result_three
                        });
                    })
                })
            }

            if(snapshot.hasChild("Fourth_Insight")===false){                        //CHECK IF FOURTH INSIGHT EXISTS
                //CREATE INSIGHT -- 4  -->   FINDS OUT IF YOUR FOOD EXPENSES MORE THAN 25% OF THE TOTAL SPENDING (EXCLUDING "OTHER SPENDING").
                var total_spending=0
                var food_spending=0
                var spending_buckets_path='users/'+user_id+'/bucketMoney/Spending Buckets'
                admin.database().ref(spending_buckets_path).once('value').then(function(snapshot) {
                    var spending_buckets = snapshot.val();
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
