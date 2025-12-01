import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isLoggedOut, getAuthToken, apiURL } from '../App';

export default function Header() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUsername = async () => {
      const request = new Request(`${apiURL}/me`, {
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
          }
        }

        const user = await response.json();
        setUsername(user.username);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsername();
  }, []);

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

        {/* center: search bar */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Groups, Events, Discussions..."
              className="w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />

            {/* search icon */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* create button */}
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 
                         text-xl text-gray-600 hover:text-green-600"
            >
              +
            </button>
          </div>
        </div>

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
          <div className="flex items-center gap-2 z-10">
            <span className="text-green-700 text-sm font-medium">
              {username}
            </span>
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}