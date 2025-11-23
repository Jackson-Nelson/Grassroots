import React from "react";
import { Auth } from "./components/login.js"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Homepage from './components/pages/Homepage.jsx'
import Groups from './components/pages/Groups.jsx'
import UserProfile from './components/UserProfile.jsx'

// many things will need to pass this auth token when they try to get any info about a user, keep logged in, etc.
// so it is exported from App
export const getAuthToken = () => {
  const tok = localStorage.getItem("auth");
  const user_id = localStorage.getItem("uid");
  return { JWT: tok, uid: user_id };
}

// const pages = [["home", Homepage], ["sign-in", Auth], ["groups", Groups] ];

function App() {
  return (
    <Router>
      <nav id="main_nav" className="bg-green">
        <Link className="nav-link" to='/home'>home</Link>
        <Link className="nav-link" to='/groups'>groups</Link>
        <Link className="nav-link" to='/sign-in'>sign-in</Link>
      </nav>

      <Routes>
        <Route exact path="/" element={<Homepage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/sign-in" element={<Auth />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/users/:userId" element={<UserProfile />} />
      </Routes>

    </Router>

  );
}

export default App;