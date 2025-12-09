import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isLoggedOut, getAuthToken, apiURL } from '../App';

export default function Header() {
  const [username, setUsername] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const request = new Request(`${apiURL}/me`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + getAuthToken().JWT
        }
      });

      try {

        const response = await fetch(request);

        if (!response.ok) {
          // could be because not logged in
          if (response.status === 401) {
            window.location.href = "/sign-in";
            throw new Error('Failed getting user info');
          } else if (response.status === 403) {
            return;
          }
          throw new Error("Failed to get user info")
        }

        const user = await response.json();
        setUsername(user.username);
      } catch (err) {

        console.error(err);
      }
    };

    if (!isLoggedOut())
      fetchUsername();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav id="main-header" className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-5 py-3">
      <div className="flex items-center justify-between w-full">

        {/* left: logo */}
        <Link to="/home" className="flex items-center no-underline z-10">
          <span className="text-3xl mr-2">🌱</span>
          <span className="text-2xl font-bold text-green-700">
            Grassroots
          </span>
        </Link>


        {/* right: user */}
        {isLoggedOut() || !username ? (
          <Link
            to="/sign-in"
            className="flex items-center gap-2 no-underline z-10"
          >
            <span className="text-green-700 text-sm">
              Sign in
            </span>
            <div className="w-10 h-10 rounded-full bg-green-700" />
          </Link>
        ) : (
          <div className="relative flex items-center gap-2 z-10" ref={dropdownRef}>
            {/* username text display */}
            <span className="text-green-700 text-sm font-medium">
              {username}
            </span>
            {/* pfp and account info/logout dropdown */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold hover:bg-green-800 transition-colors cursor-pointer focus:outline-none"
            >
              {username.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                <button
                  onClick={() => {
                    localStorage.setItem("auth", null);
                    localStorage.setItem("user", null);
                    window.location.href = "/sign-in";
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </nav>
  );
}