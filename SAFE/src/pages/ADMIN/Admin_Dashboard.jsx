import React, { useState } from "react";
import AdminLayout from "../ADMIN/Admin_Base";
import "../css/Admin_Dashboard.css";

const sampleData = {
  folders: 25,
  modules: 15,
  photos: 120,
  videos: 45,
  users: 350,
};

const sampleTableData = {
  users: [
    { id: 1, name: "Bryan Cabrera", role: "Admin" },
    { id: 2, name: "Westlee Borcelo", role: "User" },
    { id: 3, name: "Brye Carreon", role: "User" },
    { id: 4, name: "Anna Reyes", role: "Moderator" },
    { id: 5, name: "John Smith", role: "User" },
    { id: 6, name: "Jane Doe", role: "Admin" },
  ],
  modules: [
    { id: 1, title: "Math Module", status: "Active" },
    { id: 2, title: "Science Module", status: "Inactive" },
    { id: 3, title: "English Module", status: "Active" },
    { id: 4, title: "History Module", status: "Archived" },
    { id: 5, title: "Programming Basics", status: "Active" },
  ],
  folders: [
    { id: 1, name: "Grade 10", created: "2024-01-05", image: "https://via.placeholder.com/300x200?text=Grade+10" },
    { id: 2, name: "Grade 11", created: "2024-02-10", image: "https://via.placeholder.com/300x200?text=Grade+11" },
    { id: 3, name: "Teachers", created: "2023-12-15", image: "https://via.placeholder.com/300x200?text=Teachers" },
    { id: 4, name: "Students", created: "2024-03-08", image: "https://via.placeholder.com/300x200?text=Students" },
    { id: 5, name: "Resources", created: "2024-04-01", image: "https://via.placeholder.com/300x200?text=Resources" },
  ],
  photos: [
    { id: 1, name: "School Event.jpg", uploaded: "2024-03-01" },
    { id: 2, name: "Award Ceremony.jpg", uploaded: "2024-04-12" },
    { id: 3, name: "Class Photo.jpg", uploaded: "2024-02-20" },
    { id: 4, name: "Field Trip.png", uploaded: "2024-03-15" },
    { id: 5, name: "Science Fair.jpg", uploaded: "2024-01-25" },
    { id: 6, name: "Christmas Party.png", uploaded: "2023-12-20" },
  ],
  videos: [
    { id: 1, title: "Orientation.mp4", length: "5:20" },
    { id: 2, title: "Graduation.mp4", length: "10:45" },
    { id: 3, title: "Intro to Biology.mp4", length: "7:33" },
    { id: 4, title: "Math Tricks.mp4", length: "4:20" },
    { id: 5, title: "Coding Demo.mp4", length: "9:00" },
  ],
};

const headerColors = {
  folders: "#4e73df",
  modules: "#1cc88a",
  photos: "#36b9cc",
  videos: "#f6c23e",
  users: "#e74a3b",
};

const Dashboard = () => {
  const [data] = useState(sampleData);
  const [selectedCategory, setSelectedCategory] = useState("users");

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const getTableHeaders = () => {
    const items = sampleTableData[selectedCategory];
    return items.length ? Object.keys(items[0]) : [];
  };

  const getTableRows = () => {
    return sampleTableData[selectedCategory] || [];
  };

  return (
    <AdminLayout>
      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        {Object.entries(data).map(([key, value]) => (
          <div className={`dashboard-card ${key}`} key={key}>
            <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            <p>{value}</p>
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <div className="dashboard-select">
        <label htmlFor="categorySelect">Show table for: </label>
        <select
          id="categorySelect"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          {Object.keys(sampleTableData).map((key) => (
            <option key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="dashboard-table">
        <table>
          <thead>
            <tr>
              {getTableHeaders().map((header) => (
                <th
                  key={header}
                  style={{
                    backgroundColor: headerColors[selectedCategory],
                    color: selectedCategory === "videos" ? "#222" : "#fff",
                  }}
                >
                  {header.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getTableRows().map((item) => (
              <tr key={item.id}>
                {getTableHeaders().map((key) => (
                  <td key={key}>{item[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Folder Slideshow */}
      <div className="folder-slideshow-wrapper">
        <h2>Folders Preview</h2>
        <div className="folder-slideshow">
          <div className="folder-cards-container scoped-folder-scroll">
            {sampleTableData.folders.map((folder, index) => (
              <div className="folder-card" key={index}>
                <img
                  src={`https://source.unsplash.com/random/300x200?sig=${index}&folder`}
                  alt={folder.name}
                />
                <div className="folder-info">
                  <h4>{folder.name}</h4>
                  <div className="folder-actions">
                    <button className="view-btn">View</button>
                    <button className="heart-btn">❤️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
