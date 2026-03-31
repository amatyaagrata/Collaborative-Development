"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Search, Circle } from "lucide-react";
import "./users.css";

const initialUsers = [
  { id: 1, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 2, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 3, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 4, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 5, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 6, name: "Hero man", contact: "98xxxxxx", status: "active" },
  { id: 7, name: "Hero man", contact: "98xxxxxx", status: "inactive" },
  { id: 8, name: "Hero man", contact: "98xxxxxx", status: "inactive" },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = initialUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.contact.includes(searchQuery)
  );

  return (
    <AppLayout title="Users">
      <div className="users-container">
        <div className="users-card">
          
          <div className="users-search-wrapper">
            <div className="users-search">
              <Search className="users-search-icon" />
              <input
                type="text"
                placeholder="Search"
                className="users-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>
                    <div className="users-th-content">
                      <Circle className="users-circle-icon" />
                      User Name
                    </div>
                  </th>
                  <th style={{ width: "30%" }}>Contact</th>
                  <th style={{ width: "30%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-td-name">
                        <Circle className="users-circle-icon" />
                        {user.name}
                      </div>
                    </td>
                    <td>{user.contact}</td>
                    <td>
                      <span className={`users-status ${user.status}`}>
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
