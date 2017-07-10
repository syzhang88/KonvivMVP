(function() {

  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyD10H6NAii6s3rGCBKUxMYUsMn7lIG-jkg",
    authDomain: "konviv-attempt.firebaseapp.com",
    databaseURL: "https://konviv-attempt.firebaseio.com",
    projectId: "konviv-attempt",
    storageBucket: "konviv-attempt.appspot.com",
    messagingSenderId: "129647908445"
  };
  var app=firebase.initializeApp(config);
  
  //Get elements
  const txtEmail=document.getElementById('txtEmail')
  const txtPassword=document.getElementById('txtPassword')
  const btnLogin=document.getElementById('btnLogin')
  const btnSignup=document.getElementById('btnSignup')
  const btnLogout=document.getElementById('btnLogout')
  
  //Add login event
  /*btnLogin.addEventListener('click', e => {
      const email=txtEmail.value;
      const pass=txtPassword.value;
      const auth=firebase.auth();
      //Sign in
      const promise =auth.signInWithEmailAndPassword(email,pass);
      promise.catch(e => console.log(e.message));
      
  });
  //Add signup event
  btnSignup.addEventListener('click', e => {
      const email=txtEmail.value; //EMAIL VALIDATION
      const pass=txtPassword.value;
      const auth=firebase.auth();
      //Sign in
      const promise =auth.createUserWithEmailAndPassword(email,pass);
      promise.catch(e =>console.log(e.message));
  });*/
  
  //Add logout event
  btnLogout.addEventListener('click', e=>{
      firebase.auth().signOut();
      location.href="index.html"
  });
  
  //Add a listener for auth state changed
  firebase.auth().onAuthStateChanged(firebaseUser => {
      if(firebaseUser){
          console.log(firebaseUser);
          btnLogout.classList.remove('hide');
          //location.href="plaid_page.html"
      } else {
          console.log('NOT LOGGED IN');
          btnLogout.classList.add('hide');
          
      }
  });
  
}());