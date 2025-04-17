import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ('../pages/css/chatbot.css');


const Chatbot = () => {
  const [username, setUsername] = useState(""); // Username fetched from localStorage
  const [fullName, setFullName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!token || !storedUsername) {
      // Redirect to login if no token or username is stored
      window.location.href = "/login";
    } else {
      setUsername(storedUsername);
      fetchUserInfo(storedUsername);
    }
  }, []);

  const fetchUserInfo = async (username) => {
    try {
      const res = await axios.post("http://localhost:5001/api/chat/session", { username, sender: "user" });
      setFullName(res.data.fullName);
      addMessage(res.data.greeting); // Display the greeting message from backend
      fetchMenu(); // Display menu after the greeting
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const addMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: "bot" }]);
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/chat/menu");
      const buttons = res.data.choices.map(choice => ({
        text: choice.label,
        handler: () => handleChoice(choice.label.toLowerCase())
      }));

      setMessages(prev => [...prev, { text: "Choose an option:", sender: "bot", buttons }]);
    } catch (error) {
      console.error("Menu error:", error);
    }
  };

  const handleChoice = async (choice) => {
    // Handle the user's choice here (e.g., show help desk questions or other actions)
    if (choice === "help desk") {
      await fetchHelpDeskQuestions();
    }
  };

  const fetchHelpDeskQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/chat/help-desk");
      const questions = res.data.questions.map(q => ({
        text: q.question,
        handler: () => handleQuestion(q.code)
      }));

      setMessages(prev => [...prev, { text: "Choose a question:", sender: "bot", buttons: questions }]);
    } catch (error) {
      console.error("Error fetching help desk:", error);
    }
  };

  const handleQuestion = async (code) => {
    try {
      const res = await axios.get(`http://localhost:5001/api/chat/question/${code}`);
      setMessages(prev => [...prev, { text: res.data.answer, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching question answer:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input.trim(), sender: "user" }]);
    setInput("");

    // Call a backend API to process the message if necessary
  };

  return (
    <div className="chatbot-container">
      <div className="sidebar">
        <h2>EduBot 🌸</h2>
        <ul>
          <li onClick={fetchMenu}>🌟 New Chat</li>
          <li onClick={() => window.location.href = "/"}>🏠 Exit</li>
        </ul>
      </div>

      <div className="chat-main">
        <div className="chatbot-header">👋 Hello {fullName || username}!</div>
        <div className="chat-messages" ref={chatRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              {msg.text}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="button-container">
                  {msg.buttons.map((btn, i) => (
                    <button key={i} onClick={btn.handler} className="chat-button">
                      {btn.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your choice or message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
