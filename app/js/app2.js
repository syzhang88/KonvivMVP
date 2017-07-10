(function() {

  // Initialize Firebase
  const config = {
     apiKey: "AIzaSyASB9RhrUzNme-rGkVrzEXmF3nL7PwMgvQ",
    authDomain: "konvivandroid.firebaseapp.com",
    databaseURL: "https://konvivandroid.firebaseio.com",
    projectId: "konvivandroid",
    storageBucket: "konvivandroid.appspot.com",
    messagingSenderId: "41760220514" 
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