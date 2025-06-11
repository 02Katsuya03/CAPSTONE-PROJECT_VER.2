import React, { useState, useEffect } from "react";
import AdminLayout from "../ADMIN/Admin_Base";
import axios from "axios";
import "../css/Admin_User.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedView, setSelectedView] = useState("personal");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url =
          selectedView === "consent"
            ? "http://localhost:5001/api/all?hasParentConsent=true"
            : "http://localhost:5001/api/all";
  
        const response = await axios.get(url);
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };
    fetchUsers();
  }, [selectedView]); // refetch when view changes
  

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Handle nested objects
        let aValue, bValue;
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle numeric sorting for age
        if (sortConfig.key === 'age' || sortConfig.key === 'survey.ageGroup') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }

        // Handle string comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const filteredUsers = React.useMemo(() => {
    const searchLower = searchTerm?.toLowerCase() || "";
    if (!searchLower) return sortedUsers;

    return sortedUsers.filter(user => {
      // Search in all relevant fields
      const fieldsToSearch = [
        user.firstName,
        user.lastName,
        user.email,
        user.username,
        user.region,
        user.province,
        user.city,
        user.barangay,
        user.age?.toString(),
        user.survey?.ageGroup,
        user.survey?.infoSource,
        user.survey?.learningSource,
        user.parentConsent?.firstName,
        user.parentConsent?.lastName,
        user.parentConsent?.email,
        user.status
      ];

      return fieldsToSearch.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
    });
  }, [sortedUsers, searchTerm]);

  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return null;
  };

  const renderTableData = () => {
    switch (selectedView) {
      case "personal":
        return (
          <>
            <th onClick={() => handleSort('firstName')}>
              First Name {renderSortIcon('firstName')}
            </th>
            <th onClick={() => handleSort('lastName')}>
              Last Name {renderSortIcon('lastName')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email {renderSortIcon('email')}
            </th>
            <th onClick={() => handleSort('username')}>
              Username {renderSortIcon('username')}
            </th>
            <th onClick={() => handleSort('sex')}>
              Gender {renderSortIcon('sex')}
            </th>
            <th onClick={() => handleSort('age')}>
              Age {renderSortIcon('age')}
            </th>
            <th>Location</th>
          </>
        );
      case "survey":
        return (
          <>
            <th>Name</th>
            <th onClick={() => handleSort('survey.ageGroup')}>
              Age Group {renderSortIcon('survey.ageGroup')}
            </th>
            <th onClick={() => handleSort('survey.infoSource')}>
              Info Source {renderSortIcon('survey.infoSource')}
            </th>
            <th onClick={() => handleSort('survey.learningSource')}>
              Learning Source {renderSortIcon('survey.learningSource')}
            </th>
            <th onClick={() => handleSort('age')}>
              Actual Age {renderSortIcon('age')}
            </th>
          </>
        );
      case "consent":
        return (
          <>
            <th>User Name</th>
            <th onClick={() => handleSort('parentConsent.firstName')}>
              Parent Name {renderSortIcon('parentConsent.firstName')}
            </th>
            <th onClick={() => handleSort('parentConsent.email')}>
              Parent Email {renderSortIcon('parentConsent.email')}
            </th>
            <th onClick={() => handleSort('parentConsent.relationship')}>
              Relationship {renderSortIcon('parentConsent.relationship')}
            </th>
            <th onClick={() => handleSort('parentConsent.otpVerified')}>
              Verified {renderSortIcon('parentConsent.otpVerified')}
            </th>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    return filteredUsers.map((user) => (
      <tr key={user._id} className="user-row">
        {selectedView === "personal" && (
          <>
            <td>{user.firstName}</td>
            <td>{user.lastName}</td>
            <td>{user.email}</td>
            <td>{user.username || "-"}</td>
            <td>{user.sex || "-"}</td>
            <td>{user.age}</td>
            <td>{[user.region, user.province, user.city].filter(Boolean).join(", ")}</td>
          </>
        )}
        {selectedView === "survey" && (
          <>
            <td>{`${user.firstName} ${user.lastName}`}</td>
            <td>{user.survey.ageGroup}</td>
            <td>{user.survey.infoSource || "-"}</td>
            <td>{user.survey.learningSource || "-"}</td>
            <td>{user.age}</td>
          </>
        )}
        {selectedView === "consent" && (
          <>
            <td>{`${user.firstName} ${user.lastName}`}</td>
            <td>
              {user.parentConsent 
                ? `${user.parentConsent.firstName} ${user.parentConsent.lastName}`
                : "-"}
            </td>
            <td>{user.parentConsent?.email || "-"}</td>
            <td>{user.parentConsent?.relationship || "-"}</td>
            <td>
              {user.parentConsent 
                ? (user.parentConsent.otpVerified ? "✅" : "❌") 
                : "N/A"}
            </td>
          </>
        )}
        <td>
          <span className={`status-badge ${user.status}`}>
            {user.status}
          </span>
        </td>
      </tr>
    ));
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <AdminLayout>
      <div className="users-management">
        <h2>User Management</h2>
        
        <div className="controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, email, age, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search"></i>
          </div>
          
          <div className="view-selector">
            <label>View: </label>
            <select 
              value={selectedView} 
              onChange={(e) => setSelectedView(e.target.value)}
            >
              <option value="personal">Personal Info</option>
              <option value="survey">Survey Data</option>
              <option value="consent">Parent Consent</option>
            </select>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                {renderTableData()}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                renderTableRows()
              ) : (
                <tr>
                  <td colSpan="10" className="no-results">
                    No users found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;