// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Signup/SignupPage';
import ChatPage from './pages/Chat/ChatPage';
import AuthorityDashboard from './pages/Dashboard/AuthorityDashboard';
import './App.css'; 

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTQRmLC5O_xLSfOj4Nebj0ZuNU7RJK1r0",
  authDomain: "nano-heal-5440b.firebaseapp.com",
  projectId: "nano-heal-5440b",
  storageBucket: "nano-heal-5440b.firebasestorage.app",
  messagingSenderId: "343883438881",
  appId: "1:343883438881:web:84e97d8e0da95fa3ccfc60",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [userDetails, setUserDetails] = useState({ role: null, location: null });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserDetails({ role: null, location: null });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (data) => {
    setUserDetails({ role: data.role, location: data.location });
  };

  const handleSignupSuccess = () => {
    setCurrentView('login');
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
  };

  if (!user) {
    return (
      <div>
        {currentView === 'login' ? (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onToggleAuth={() => setCurrentView('signup')}
          />
        ) : (
          <SignupPage 
            onSignupSuccess={handleSignupSuccess} 
            onToggleAuth={() => setCurrentView('login')}
          />
        )}
      </div>
    );
  } else {
    if (userDetails.role === 'Authority') {
      return <AuthorityDashboard user={userDetails} handleLogout={handleLogout} />;
    } else {
      return <ChatPage user={userDetails} handleLogout={handleLogout} />;
    }
  }
}

export default App;
