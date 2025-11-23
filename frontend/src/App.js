import React from "react";
import { Auth } from "./components/login.js"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Homepage from './components/pages/Homepage.jsx'
import Groups from './components/pages/Groups.jsx'


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
              {/* <Route exact path="/" element={<Menu />} /> */}
              <Route path="/home" element={<Homepage />} />
              <Route path="/sign-in" element={<Auth />} />
              <Route path="/groups" element={<Groups />} />
            </Routes>

    </Router>

  );
}

export default App;