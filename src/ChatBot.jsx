import React, { useState, useRef } from "react";
import "./ChatBot.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faMicrophone, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const ChatBot = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  
  const handleSend = () => {
    console.log("Message sent:", message || file?.name || "Voice message");
    setMessage("");
    setFile(null);
  };
  
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
  
  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    const recognitionInstance = new window.webkitSpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "en-US";
    
    recognitionInstance.onstart = () => setRecording(true);
    recognitionInstance.onend = () => setRecording(false);
    recognitionInstance.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
    };
    
    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };
  
  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };
  
  // Move the resizing functions outside `stopRecording`
  const startResizing = (event) => {
    isResizing.current = true;
    document.addEventListener("mousemove", resizeSidebar);
    document.addEventListener("mouseup", stopResizing);
  };
  
  const resizeSidebar = (event) => {
    if (isResizing.current) {
      setSidebarWidth(window.innerWidth - event.clientX);
    }
  };
  
  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resizeSidebar);
    document.removeEventListener("mouseup", stopResizing);
  };
  
  return (
    <div
      className="chatbot-sidebar"
      style={{ width: `${sidebarWidth}px` }}
      ref={sidebarRef}
    >
      <div className="chatbot-header">
        <h2>Chat with Tailor!</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="chatbot-resizer" onMouseDown={startResizing}></div>
      <div className="chatbot-content">
        <p>Welcome to Tailor. How can I help you today?</p>
      </div>
      {/* Footer Section */}
      <div className="chatbot-footer">
        <textarea
          className="chatbot-input"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <label className="file-label" htmlFor="file-input">
         <FontAwesomeIcon icon={faPaperclip} />
        </label>
        <input
          type="file"
          id="file-input"
          className="chatbot-file"
          onChange={handleFileChange}
        />
        {/* Send Button */}
        <button className="chatbot-send" onClick={handleSend}>
         <FontAwesomeIcon icon={faPaperPlane} />
          </button>
         <button
          className={`chatbot-voice ${recording ? "recording" : ""}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
        >
          <FontAwesomeIcon icon={faMicrophone} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;