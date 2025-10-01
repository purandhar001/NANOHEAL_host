import React, { useState } from 'react';
import './LoginPage.css';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const LoginPage = ({ onLoginSuccess, onToggleAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();

      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Server verification failed');
      
      console.log('Backend verification successful:', data);
      onLoginSuccess(data);

    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Nano Heal Login</h2>
        
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button">Login</button>

        <p className="signup-link">
          Don’t have an account?{" "}
          <button type="button" onClick={onToggleAuth} className="link-button">
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
