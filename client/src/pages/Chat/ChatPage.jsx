import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css';

const ChatPage = ({ user, handleLogout }) => {
  const [messages, setMessages] = useState([
    { text: 'Hello! I am Nano Heal. How can I help you with your health questions today?', sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage, location: user?.location || 'Unknown' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const botMessage = { text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      const errorMessage = { text: `Sorry, I encountered an error: ${error.message}`, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-fullscreen">
      <header className="chat-header">
        <div>
          <h2>Hi there,</h2>
          <h3>How can I help you?</h3>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {/* Chat Messages */}
      <div className="messages-section">
        {messages.map((msg, index) => (
          <div key={index} className={`msg-bubble ${msg.sender}-bubble`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="msg-bubble bot-bubble loading-bubble">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Ask whatever you want..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>➤</button>
      </form>
    </div>
  );
};

export default ChatPage;
