import React, { useState, useEffect } from 'react';

const placeholderImg = "https://picsum.photos/400/300";

const EventCard = ({ event }) => {
  
  // get location from event
  const location = event.address 
    ? `${event.address}, ${event.city}, ${event.state} ${event.zip}`
    : `${event.address}, ${event.city}, ${event.country}`;
  
  // format date and time
  const eventDateTime = event.event_time 
    ? `${new Date(event.event_date).toLocaleDateString()} at ${event.event_time.substring(0, 5)}`
    : new Date(event.event_date).toLocaleDateString();

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden w-full md:w-[30%] mb-5 bg-white shadow-sm">
      <img
        src={event.image_url || placeholderImg}
        alt={event.title}
        className="w-full h-52 object-cover"
      />
      <div className="p-4">
        <h5 className="text-green-700 font-semibold mb-2">
          {eventDateTime} - {event.title}
        </h5>
        {location && (
          <p className="text-gray-600 text-sm mb-1">{location}</p>
        )}
        {event.description && (
          <p className="text-gray-800 text-sm">{event.description}</p>
        )}
      </div>
    </div>
  );
};

const GroupCard = ({ group }) => (
  <div className="border border-gray-200 rounded-md overflow-hidden w-full md:w-[30%] mb-5 bg-white shadow-sm">
    <img
      src={group.avatar_url || placeholderImg}
      alt={group.name}
      className="w-full h-52 object-cover"
    />
    <div className="p-4">
      <h5 className="text-green-700 font-semibold mb-2">
        {group.name}
      </h5>
      {group.description && (
        <p className="text-gray-600 text-sm mb-1">{group.description}</p>
      )}
      <p className="text-gray-500 text-xs">
        {group.city}, {group.state}
      </p>
    </div>
  </div>
);

const Homepage = () => {
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // example user for frontend purposes.
        const userId = 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'; // celina's userid
        const userLocation = {
          city: 'Bellingham',
          state: 'Washington',
          zip: '98225',
          country: 'United States'
        };

        /* this will replace the above once the backend is implemented
        const user = getCurrentUser();
        const userId = user.id;
        const userLocation = user.location;
        */

        /* the "http://localhost:4000" will be replaced with the base URL .env variable once the backend is implemented. need to fix CORS */

        // fetch nearby events TODO: fix the query so that params can be more flexible.
        const eventsUrl = new URL('http://localhost:4000/api/events/nearby');
        eventsUrl.searchParams.append('city', userLocation.city);
        eventsUrl.searchParams.append('state', userLocation.state);
        eventsUrl.searchParams.append('zip', userLocation.zip);
        eventsUrl.searchParams.append('country', userLocation.country);

        // Fetch user's groups with user_id
        const groupsUrl = new URL('http://localhost:4000/api/groups/my-groups');
        groupsUrl.searchParams.append('user_id', userId);

        const eventsRes = await fetch(eventsUrl);
        const groupsRes = await fetch(groupsUrl);

        if (!eventsRes.ok || !groupsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const eventsData = await eventsRes.json();
        const groupsData = await groupsRes.json();

        setEvents(eventsData);
        setGroups(groupsData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <nav className="bg-white border-b border-gray-200 px-5 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center no-underline">
            <span className="text-3xl mr-2">🌱</span>
            <span className="text-2xl font-bold text-green-700">
              Grassroots
            </span>
          </a>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search Groups, Events, Discussions..."
                className="w-80 pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-xl text-gray-600 hover:text-green-600"
              >
                +
              </button>
            </div>

            <a
              href="#"
              className="flex items-center gap-2 no-underline"
            >
              <span className="text-green-700 text-sm">
                my_username
              </span>
              <div className="w-10 h-10 rounded-full bg-green-700" />
            </a>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-5 py-8">
        {/* EVENTS SECTION */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-green-700 mb-5">
            Events Near Me →
          </h2>

          {loading && <p className="text-gray-700">Loading events...</p>}
          {error && (
            <p className="text-red-600">
              Error: {error}
            </p>
          )}

          <div className="flex flex-wrap gap-5">
            {!loading && !error && events.length === 0 && (
              <p className="text-gray-600">
                No upcoming events found.
              </p>
            )}
            {events.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        </section>

        {/* GROUPS SECTION */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-green-700 mb-5">
            My Groups →
          </h2>

          {loading && <p className="text-gray-700">Loading groups...</p>}
          {error && (
            <p className="text-red-600">
              Error: {error}
            </p>
          )}

          <div className="flex flex-wrap gap-5">
            {!loading && !error && groups.length === 0 && (
              <p className="text-gray-600">
                You haven't joined any groups yet.
              </p>
            )}
            {groups.map((group) => (
              <GroupCard key={group.group_id} group={group} />
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto px-8 py-5 text-right">
        <div>
          <a href="#" className="text-green-700 no-underline">
            About Us
          </a>
        </div>
        <div>
          <a href="#" className="text-green-700 no-underline">
            Contact
          </a>
        </div>
        <div>
          <a href="#" className="text-green-700 no-underline">
            Tutorial
          </a>
        </div>
        <div>
          <a href="#" className="text-green-700 no-underline">
            Language ⌄
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;