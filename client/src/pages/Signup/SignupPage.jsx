import React, { useState } from 'react';
import './SignupPage.css';

const SignupPage = ({ onSignupSuccess, onToggleAuth }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !location) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, location, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      console.log('Signup successful:', data);
      onSignupSuccess();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>Create Nano Heal Account</h2>
        
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>
        
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
            placeholder="Create a password"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your city"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="User">User</option>
            <option value="Authority">Authority</option>
          </select>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="signup-button">Sign Up</button>

        <p className="login-link">
          Already have an account?{" "}
          <button type="button" onClick={onToggleAuth} className="link-button">
            Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
