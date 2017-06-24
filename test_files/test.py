# import os
# import datetime
# import plaid
import pyrebase

#Plaid Setup

# PLAID_CLIENT_ID = '593981e0bdc6a401d71d87b5'
# PLAID_SECRET = '271426f90259600c6bf365d6b0f0aa'
# PLAID_PUBLIC_KEY = '9f4ef21fdb37b5c0e3f80290db7716'
# # Use 'sandbox' to test with Plaid's Sandbox environment (username: user_good,
# # password: pass_good)
# PLAID_ENV='sandbox'
#
# client = plaid.Client(client_id = PLAID_CLIENT_ID, secret=PLAID_SECRET,
#                   public_key=PLAID_PUBLIC_KEY, environment=PLAID_ENV)

#Firebase Setup

config = {
  "apiKey": "AIzaSyDknYjy-WW7SH7aLJ2D3p94r4a1s3TU_W8",
  "authDomain": "konviv-demo.firebaseapp.com",
  "databaseURL": "https://konviv-demo.firebaseio.com",
  "storageBucket": "konviv-demo.appspot.com",
  "serviceAccount": "konviv-demo-firebase-adminsdk-ee5ad-bd8a1edd7c.json"

}

firebase = pyrebase.initialize_app(config)

db = firebase.database()

# Get a reference to the auth service
auth = firebase.auth()

# create the user account
auth.create_user_with_email_and_password('szhang@gmail.com', 'password')

# Log the user in
user = auth.sign_in_with_email_and_password('szhang@gmail.com', 'password')

# Get a reference to the database service
db = firebase.database()

# data to save
data = {
    "name": "Samuel 'Sammy' Zhang"
}

# Pass the user's idToken to the push method
results = db.child("users").push(data, user['idToken'])

# #Actual Test
#
# start_date = "{:%Y-%m-%d}".format(datetime.datetime.now() + datetime.timedelta(-30))
# end_date = "{:%Y-%m-%d}".format(datetime.datetime.now())
#
# response = client.Transactions.get(access_token, start_date, end_date)
#
# db.child("users").push(response)
