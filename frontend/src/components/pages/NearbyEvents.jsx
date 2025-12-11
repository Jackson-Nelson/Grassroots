import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';
import getLocale from '../../utils/getcoords';

const placeholderImg = "https://picsum.photos/400/300";

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  // get location from event
  const location = event.address
    ? `${event.address}, ${event.city}, ${event.state} ${event.zip}`
    : `${event.address}, ${event.city}, ${event.country}`;

  // format date
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  const handleClick = () => {
    navigate(`/events/${event.event_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 rounded-md overflow-hidden w-full bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img
          src={event.image_url || placeholderImg}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm">
          <p className="text-xs font-semibold text-gray-700">{eventDate}</p>
        </div>
      </div>
      <div className="p-4">
        <h5 className="text-green-700 font-semibold text-lg mb-2">
          {event.title}
        </h5>
        <p className="text-gray-600 text-sm mb-2">{location}</p>
        {event.description && (
          <p className="text-gray-500 text-sm line-clamp-3">{event.description}</p>
        )}
      </div>
    </div>
  );
};

const NearbyEvents = () => {
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUserLoc, setUserLoc] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Events Near Me -- Grassroots';

    const fetchLoc = async () => {
      const request = new Request(`${apiURL}/me`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + getAuthToken().JWT
        }
      });

      try {
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error('Failed getting location');
        }

        const user = await response.json();
        setUserLoc({ city: user.city, state: user.state, country: user.country });

      } catch (err) {
        console.error(err);
      }
    }

    if (isLoggedOut()) {
      getLocale(setUserLoc);
    } else {
      fetchLoc();
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // fetch nearby events
        const eventsUrl = new URL(`${apiURL}/events/nearby`);
        eventsUrl.searchParams.append('city', hasUserLoc.city);
        eventsUrl.searchParams.append('state', hasUserLoc.state);
        eventsUrl.searchParams.append('country', hasUserLoc.country);

        const eventsRes = await fetch(eventsUrl);
        if (!eventsRes.ok) {
          const errorText = await eventsRes.text();
          throw new Error(`Failed to fetch events: ${eventsRes.status} ${errorText}`);
        }
        const eventsData = await eventsRes.json();
        setNearbyEvents(eventsData);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hasUserLoc)
      fetchData();
  }, [hasUserLoc]);

  return (
    <div className="flex flex-col relative">
      <main className="flex-1 w-full px-8 py-8">
        <button onClick={() => navigate('/home')} className="mb-6 text-green-700 hover:underline">
          ← Back to Home
        </button>

        <section className="mb-6">
          <h1 className="text-2xl font-semibold text-green-700 mb-5">
            Events Near Me
          </h1>

          {loading && <p className="text-gray-700">Loading events...</p>}
          {error && (
            <p className="text-red-600">
              Error: {error}
            </p>
          )}

          {!loading && !error && nearbyEvents.length === 0 && (
            <p className="text-gray-600">
              No upcoming events found.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nearbyEvents.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default NearbyEvents;
