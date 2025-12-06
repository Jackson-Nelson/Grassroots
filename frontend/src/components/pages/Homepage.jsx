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

  // format date and time
  const eventDateTime = event.event_time
    ? `${new Date(event.event_date).toLocaleDateString()} at ${event.event_time.substring(0, 5)}`
    : new Date(event.event_date).toLocaleDateString();

  const handleClick = () => {
    navigate(`/events/${event.event_id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="border border-gray-200 rounded-md overflow-hidden w-full md:w-[30%] mb-5 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
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

  const [hasUserLoc, setUserLoc] = useState(false);

  useEffect(() => {
    const fetchLoc = async () => {
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
            throw new Error('Failed getting your location: ' + response.text());
          }
        }

        const user = await response.json();
        setUserLoc({ city: user.city, state: user.state, country: user.country });

      } catch (err) {
        console.error(err);
      }
    }

    if(isLoggedOut()){
      getLocale(setUserLoc);
    }else{
      fetchLoc();
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // example user for frontend purposes.
        // const userId = 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'; // celina's userid
        // const userLocation = {
        //   city: 'Bellingham',
        //   state: 'Washington',
        //   zip: '98225',
        //   country: 'United States'
        // };

        /* this will replace the above once the backend is implemented
        const user = getCurrentUser();
        const userId = user.id;
        const userLocation = user.location;
        */

        /* the "http://localhost:4000" will be replaced with the base URL .env variable once the backend is implemented. need to fix CORS */

        // fetch nearby events TODO: fix the query so that params can be more flexible.
        const eventsUrl = new URL(`${apiURL}/events/nearby`);
        eventsUrl.searchParams.append('city', hasUserLoc.city);
        eventsUrl.searchParams.append('state', hasUserLoc.state);
        // eventsUrl.searchParams.append('zip', userLocation.zip);
        eventsUrl.searchParams.append('country', hasUserLoc.country);
        
        // Fetch user's groups with user_id
        // groupsUrl.searchParams.append('user_id', userId);
        
        const eventsRes = await fetch(eventsUrl);
        if (!eventsRes.ok) {
          const errorText = await eventsRes.text();
          throw new Error(`Failed to fetch events: ${eventsRes.status} ${errorText}`);
        }
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

        if(!isLoggedOut()){
          const groupsReq = new Request(`${apiURL}/groups/my-groups/`, {
            headers: {
              "Authorization": "Bearer " + getAuthToken().JWT
            }
          });
          
          
          const groupsRes = await fetch(groupsReq);
          if (!groupsRes.ok) {
            if(groupsRes.status !== 403){
              const errorText = await groupsRes.text();
              throw new Error(`Failed to fetch groups: ${groupsRes.status} ${errorText}`);
            }
          }
          
          const groupsData = await groupsRes.json();
          setGroups(groupsData);
        }

      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    console.log(hasUserLoc)
    if (hasUserLoc)
      fetchData();
  }, [hasUserLoc]);

  return (
    <div className="flex flex-col relative">
      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-8 py-8">
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

      {/* footer */}
      <footer className="fixed bottom-0 right-0 px-8 py-5 text-right z-10">
        <div className="flex flex-col gap-1">
          <a href="#" className="text-green-700 no-underline hover:underline">
            About Us
          </a>
          <a href="#" className="text-green-700 no-underline hover:underline">
            Contact
          </a>
          <a href="#" className="text-green-700 no-underline hover:underline">
            Tutorial
          </a>
          <a href="#" className="text-green-700 no-underline hover:underline">
            Language ⌄
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;