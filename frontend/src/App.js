import React from "react";
import { Auth } from "./components/login.js"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Homepage from './components/pages/Homepage.jsx'
import Groups from './components/pages/Groups.jsx'
import UserProfile from './components/UserProfile.jsx'
import EventPage from './components/pages/EventPage.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import GroupPage from "./components/pages/Group.jsx";


// many things will need to pass this auth token when they try to get any info about a user, keep logged in, etc.
// so it is exported from App
export const getAuthToken = () => {
  const tok = localStorage.getItem("auth");
  const user = localStorage.getItem("user");

  // user has properties uid, username, and email
  return { JWT: tok, user: JSON.parse(user) };
}

export const isLoggedOut = () => {
  return localStorage.getItem('user') === `${null}`;
}

export const apiURL = 'http://localhost:4000/api';
// const pages = [["home", Homepage], ["sign-in", Auth], ["groups", Groups] ];

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* header */}
        <Header />

        {/* sidebar */}
        <Sidebar />

        {/* main content */}
        <div className="flex-1 pl-24 pt-[65px]">
          <Routes>
            <Route exact path="/" element={<Homepage />} />
            <Route path="/home" element={<Homepage />} />
            <Route path="/sign-in" element={<Auth />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/events/:eventId" element={<EventPage />} />
            <Route path="/groups/:groupId" element={< GroupPage />} />
          </Routes>
        </div>
      </div>
    </Router>

  );
}

export default App;