// src/layouts/AdminLayout.jsx
import 'boxicons/css/boxicons.min.css';
import React, { useState } from "react";
import "../css/Admin.css";
import { Link } from "react-router-dom";
import Logout from '../../components/LogoutButton'; // ✅ Import your Logout component

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const username = "Bryan";

  return (
    <div className={`admin-wrapper light`}>
      {/* Sidebar */}
      <aside className={`sidebar1 ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-content">
          <h3>SAFE</h3>
          <div className="sidebar-underline"></div>
          <ul>
            <li><Link to="/dashboard"><i className='bx bx-grid-alt'></i> <span>Dashboard</span></Link></li>
            <li><Link to="/user"><i className='bx bx-user'></i> <span>Users</span></Link></li>
            <li><Link to="/reports"><i className='bx bx-file'></i> <span>Reports</span></Link></li>
            <li><Link to="/settings"><i className='bx bx-cog'></i> <span>Settings</span></Link></li>
          </ul>
        </div>
      </aside>

      {/* Main Section */}
      <div className="main-section">
        <header className="navbar">
          <i className="bx bx-menu hamburger-icon" onClick={toggleSidebar}></i>

          <div className="navbar-actions">
            <div className="profile-wrapper">
              <div className="profile-icon">
                <i className="bx bx-user"></i>
              </div>
              <div className="dropdown-menu">
                <div className="dropdown-profile">
                  <i className="bx bx-user profile-avatar"></i>
                  <span className="profile-name">{username}</span>
                </div>
                <ul>
                  <li><a href="#">Edit Profile</a></li>
                  <li><Logout className="custom-logout-link" /></li> {/* ✅ Use Logout here */}
                </ul>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
