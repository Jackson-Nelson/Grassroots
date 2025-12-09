import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <button onClick={() => navigate('/home')} className="mb-6 text-green-700">
        ← Back to Home
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-700 mb-4">About Us</h1>
      </div>

      {/* vision & goals */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Our Vision</h3>
            <p className="text-gray-600">
              Creating a platform where communities can come together, share ideas, and organize meaningful events 
              to make positive change in their local areas.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Our Goals</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Increase civic engagement in local politics</li>
              <li>Foster active discussion about our community's needs</li>
              <li>Make it easy to discover and join events in your area</li>
              <li>Support grassroots organizations and movements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* our team */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ian Royce</h3>
            <p className="text-gray-600 text-sm mb-2">Developer</p>
            <p className="text-gray-500 text-sm">
              Ayo its ya boy. What more need to be said?
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Jackson Nelson</h3>
            <p className="text-gray-600 text-sm mb-2">Developer</p>
            <p className="text-gray-500 text-sm">
              JACKSON WRITE ABOUT YOURSELF HERE
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Celina Vo</h3>
            <p className="text-gray-600 text-sm mb-2">Developer</p>
            <p className="text-gray-500 text-sm">
              I'm a Computer Science student at WWU and worked mainly frontend on this project.
            </p>
            <p className="text-gray-500 text-sm">
                Fun facts: I love movies, browsing eBay, and collecting CDs.
            </p>
          </div>
        </div>
      </div>

      {/* link to our other site */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Learn More</h2>
        <p className="text-gray-600 mb-4">
          Want to learn more about our research-driven development process? Check out our explainer site for 
          detailed information about our platform and features!
        </p>
        <a 
          href="https://sites.google.com/view/grassroots-info/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
        >
          Visit Our Explainer Site →
        </a>
      </div>
    </div>
  );
};

export default AboutUs;
