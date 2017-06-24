var React = require('react');
var PlaidLink = require('react-plaid-link');

var App = React.createClass({
  handleOnSuccess: function(token, metadata) {
    window.makeRequest({
      parameters: {
        token: token,
        metadata: metadata,
      },
      url: 'https://clientwebsite.com/exchangeLinkToken/',
      method: 'POST',
      onError: function() {},
      onLoad: function(statusCode, responseBody) {},
    });
  },
  handleOnExit: function() {
    console.log('link: user exited');
  },
  handleOnLoad: function() {
    console.log('link: loaded');
  },
  render: function() {
    return (
      <PlaidLink
        clientName="Plaid Client"
        env="sandbox"
        product="auth"
        publicKey="test_key"
        selectAccount={true}
        className="some-class-name"
        onSuccess={this.handleOnSuccess}
        onExit={this.handleOnExit}
        onLoad={this.handleOnLoad} >
        <span>Open Plaid Link button</span>
      </PlaidLink>
    );
  }
});

export default App;
