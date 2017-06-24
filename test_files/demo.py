import os
import datetime
import plaid
from flask import Flask

app = Flask(__name__)

PLAID_CLIENT_ID = '593981e0bdc6a401d71d87b5'
PLAID_SECRET = '9f4ef21fdb37b5c0e3f80290db7716'
PLAID_PUBLIC_KEY = '9f4ef21fdb37b5c0e3f80290db7716'
PLAID_ENV='sandbox'

client = plaid.Client(client_id = PLAID_CLIENT_ID, secret=PLAID_SECRET,
                  public_key=PLAID_PUBLIC_KEY, environment=PLAID_ENV)

access_token = None
public_token = None

# public_token = request.form['public_token']
exchange_response = client.Item.public_token.exchange(public_token)
access_token = exchange_response['access_token']


# client = plaid.Client(client_id = PLAID_CLIENT_ID, secret=PLAID_SECRET,
#                   public_key=PLAID_PUBLIC_KEY, environment=PLAID_ENV)
#
# @app.route('/')
# def hello_world():
#     return 'Hello, World!'
