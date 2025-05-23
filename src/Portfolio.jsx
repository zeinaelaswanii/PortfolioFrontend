import React, { useState, useEffect } from "react";
import "./Portfolio.css";
import axios from "axios";
import { Link } from 'react-router-dom';
import { 
  FaFolder, FaFolderOpen, FaPlus, FaPencilAlt, FaTrash, FaUpload, FaFileAlt,
  FaChevronDown, FaChevronRight, FaSearch, FaRobot
} from "react-icons/fa";
import ChatBot from "./ChatBot";

const getUserId = () => {
  let tempId = localStorage.getItem('tempUserId');
  if (!tempId) {
    tempId = '664f4567e2c79e6a15cfbd32';
    localStorage.setItem('tempUserId', tempId);
  }
  return tempId;
};

const userId = getUserId();

const API = axios.create({
  baseURL: "http://localhost:5004/api/portfolio",
  headers: {
    'x-dev-user': userId
  }
});

const Portfolio = () => {
  const [folders, setFolders] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
  try {
    const res = await API.get(`/folders`);
    const folderList = res.data;

    const folderMap = {};
    folderList.forEach(f => {
      folderMap[f._id] = {
        id: f._id,
        name: f.folderName,
        files: f.documents || [],
        parentFolder: f.parentFolder,
        isOpen: false,
        children: [],
      };
    });

    const rootFolders = [];
    folderList.forEach(f => {
      if (f.parentFolder) {
        const parent = folderMap[f.parentFolder];
        if (parent) {
          parent.children.push(folderMap[f._id]);
        } else {
          rootFolders.push(folderMap[f._id]);
        }
      } else {
        rootFolders.push(folderMap[f._id]);
      }
    });

    setFolders(rootFolders);
  } catch (err) {
    console.error("Error fetching folders:", err);
  }
};

  const toggleFolderOpen = (folderId) => {
  const toggle = (folders) => {
    return folders.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, isOpen: !folder.isOpen };
      }
      if (folder.children && folder.children.length > 0) {
        return { ...folder, children: toggle(folder.children) };
      }
      return folder;
    });
  };

  setFolders(toggle(folders));
};


  const handleAddFolder = async (parentFolderId = null) => {
  const name = prompt("Enter folder name:");
  if (!name?.trim()) return;
  try {
    await API.post('/folders', {
      folderName: name.trim(),
      parentFolder: parentFolderId,  
    });
    fetchFolders();
  } catch (err) {
    console.error("Error creating folder:", err);
    alert("Could not create folder. See console.");
  }
};


  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Are you sure you want to delete this folder?")) return;
    try {
      await API.delete(`/folders/${folderId}`);
      fetchFolders();
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert("Could not delete folder. See console.");
    }
  };

  const handleRenameFolder = async (folderId) => {
    const newName = prompt("Enter new folder name:");
    if (!newName?.trim()) return;
    try {
      await API.patch(`/folders/${folderId}`, { newFolderName: newName.trim() });
      fetchFolders();
    } catch (err) {
      console.error("Error renaming folder:", err);
      alert("Could not rename folder. See console.");
    }
  };

  const handleFileUpload = async (e, folderId) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId);
    formData.append("category", "general");
    try {
      await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchFolders();
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Upload failed. Check console.");
    }
    e.target.value = null;
  };

  const handleDeleteFile = async (fileId) => {
  console.log("Deleting file with id:", fileId);
  if (!window.confirm("Delete this file?")) return;
  try {
    await API.delete(`/file/${fileId}`);
    fetchFolders();
  } catch (err) {
    console.error("Error deleting file:", err);
    alert("Could not delete file. See console.");
  }
};


  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const sizes = ['Bytes','KB','MB','GB','TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return <FaFileAlt className={`file-icon ${ext === 'pdf' ? 'file-icon-pdf' : ''}`} />;
  };

  const filterBySearch = (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase());

  const renderFolders = (folderArray = folders) => {
  return folderArray
    .filter(f => !searchTerm || filterBySearch(f))
    .map(folder => (
      <div key={folder.id} className="folder-container">
        <div className={`folder-item ${folder.isOpen ? 'folder-open' : ''}`}>
          <div className="folder-header" onClick={() => toggleFolderOpen(folder.id)}>
            <div className="folder-toggle">{folder.isOpen ? <FaChevronDown /> : <FaChevronRight />}</div>
            <div className="folder-label">{folder.isOpen ? <FaFolderOpen /> : <FaFolder />}<span>{folder.name}</span></div>
          </div>
          <div className="folder-actions">
            <button className="add-btn" onClick={() => handleAddFolder(folder.id)} title="Add Subfolder"><FaPlus/></button>
            <label className="upload-btn" title="Upload File">
              <FaUpload />
              <input type="file" onClick={e => e.stopPropagation()} onChange={e => handleFileUpload(e, folder.id)} className="file-input" />
            </label>
            <button className="edit-btn" onClick={() => handleRenameFolder(folder.id)} title="Rename Folder"><FaPencilAlt /></button>
            <button className="delete-btn" onClick={() => handleDeleteFolder(folder.id)} title="Delete Folder"><FaTrash /></button>
          </div>
        </div>

        {folder.isOpen && (
          <div className="folder-content">
            {/* Files */}
            {folder.files.length > 0 ? (
              folder.files.map(file => (
                <div key={file._id} className="file-item">
                  {getFileIcon(file.fileName)}
                  <div className="file-info">
                    <a 
                      href={`http://localhost:5004${file.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="file-name-link"
                    >
                      {file.fileName}
                    </a>
                    <span className="file-details">{formatFileSize(file.fileSize)}</span>
                  </div>
                  <button className="file-action-btn delete-btn" onClick={() => handleDeleteFile(file._id)} title="Delete File"><FaTrash/></button>
                </div>
              ))
            ) : (
              <div className="empty-folder"><p>This folder is empty</p></div>
            )}

            {/* Subfolders */}
            <div className="subfolders">
              {renderFolders(folder.children)}
            </div>
          </div>
        )}
      </div>
    ));
};

  return (
    <div className={`portfolio-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="portfolio-container">
        <div className="portfolio-header">
          <h1 className="portfolio-title">My Portfolio</h1>
          <div className="header-actions">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Search files & folders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
            </div>
            <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? "☀️" : "🌙"}</button>
            <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="side-menu">
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/portfolio" className="active">Portfolio</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <li><Link to="/help">Help</Link></li>
            </ul>
          </div>
        )}
        <div className="portfolio-content">
          <div className="folders-section">
            {renderFolders()}
            <button className="add-folder-button" onClick={handleAddFolder}><FaPlus /> Add Folder</button>
          </div>
        </div>
        <div className="chatbot-wrapper">
          <button className="chatbot-button" onClick={() => setShowChat(!showChat)} aria-label="Open ChatBot"><FaRobot className="robot-icon" /></button>
          {showChat && <ChatBot onClose={() => setShowChat(false)} />}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;