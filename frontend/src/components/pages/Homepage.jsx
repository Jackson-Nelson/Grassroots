import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';
import getLocale from '../../utils/getcoords';

const placeholderImg = "https://picsum.photos/400/300";

export const EventCard = ({ event }) => {
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
    className="border border-gray-200 rounded-md overflow-hidden w-full max-w-[250px] mb-2 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    > 
    {/* removed md:w-[18%] */}
      <div className="relative">
        <img
          src={event.image_url || placeholderImg}
          alt={event.title}
          className="w-full h-24 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm">
          <p className="text-xs font-semibold text-gray-700">{eventDate}</p>
        </div>
      </div>
      <div className="p-2">
        <h5 className="text-green-700 font-semibold text-md mb-1">
          {event.title}
        </h5>
        <p className="text-gray-600 text-xs mb-1">{location}</p>
        {event.description && (
          <p className="text-gray-500 text-xs line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
};

const GroupCard = ({ group }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 rounded-md overflow-hidden w-full md:w-[18%] mb-5 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <img
        src={group.avatar_url || placeholderImg}
        alt={group.name}
        className="w-full h-24 object-cover"
      />
      <div className="p-2">
        <h5 className="text-green-700 font-bold mb-1 text-base">
          {group.name}
        </h5>
        {group.description && (
          <p className="text-gray-600 text-xs mb-1 line-clamp-2">{group.description}</p>
        )}
        <p className="text-gray-500 text-xs">
          {group.city}, {group.state}
        </p>
      </div>
    </div>
  );
}

const Homepage = () => {
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [groupEvents, setGroupEvents] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [nearbyGroups, setNearbyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hasUserLoc, setUserLoc] = useState(false);

  useEffect(() => {
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

    if (isLoggedOut()) {
      getLocale(setUserLoc);
    } else {
      fetchLoc();
    }
  }, [])

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

        if (!isLoggedOut()) {
          // fetch my groups
          const myGroupsReq = new Request(`${apiURL}/groups/my-groups/`, {
            headers: {
              "Authorization": "Bearer " + getAuthToken().JWT
            }
          });

          const myGroupsRes = await fetch(myGroupsReq);
          if (!myGroupsRes.ok) {
            if (myGroupsRes.status !== 403) {
              const errorText = await myGroupsRes.text();
              throw new Error(`Failed to fetch groups: ${myGroupsRes.status} ${errorText}`);
            }
          }

          const myGroupsData = await myGroupsRes.json();
          setMyGroups(myGroupsData);

          // fetch my events (RSVP'd)
          const myEventsReq = new Request(`${apiURL}/events/my-events`, {
            headers: {
              "Authorization": "Bearer " + getAuthToken().JWT
            }
          });

          const myEventsRes = await fetch(myEventsReq);
          if (myEventsRes.ok) {
            const myEventsData = await myEventsRes.json();
            setMyEvents(myEventsData);
          }

          // fetch my group events
          const groupEventsReq = new Request(`${apiURL}/events/my-group-events`, {
            headers: {
              "Authorization": "Bearer " + getAuthToken().JWT
            }
          });

          const groupEventsRes = await fetch(groupEventsReq);
          if (groupEventsRes.ok) {
            const groupEventsData = await groupEventsRes.json();
            setGroupEvents(groupEventsData);
          }

          // fetch nearby groups
          const nearbyGroupsUrl = new URL(`${apiURL}/groups/nearby`);
          nearbyGroupsUrl.searchParams.append('city', hasUserLoc.city);
          nearbyGroupsUrl.searchParams.append('state', hasUserLoc.state);
          nearbyGroupsUrl.searchParams.append('country', hasUserLoc.country);

          const nearbyGroupsRes = await fetch(nearbyGroupsUrl);
          if (nearbyGroupsRes.ok) {
            const nearbyGroupsData = await nearbyGroupsRes.json();
            setNearbyGroups(nearbyGroupsData);
          }
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

        {/* EVENTS NEAR ME SECTION */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-green-700 mb-5">
            Events Near Me →
          </h2>

          {loading && <p className="text-gray-700">Loading events...</p>}
          {error && (
            <p className="text-red-600">
              Error: {error}
            </p>
          )}

          <div className="flex flex-wrap gap-5">
            {!loading && !error && nearbyEvents.length === 0 && (
              <p className="text-gray-600">
                No upcoming events found.
              </p>
            )}
            {nearbyEvents.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        </section>

        {/* GROUPS NEAR ME SECTION */}
        {!isLoggedOut() && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-5">
              Groups Near Me →
            </h2>

            {loading && <p className="text-gray-700">Loading groups...</p>}
            {error && (
              <p className="text-red-600">
                Error: {error}
              </p>
            )}

            <div className="flex flex-wrap gap-5">
              {!loading && !error && nearbyGroups.length === 0 && (
                <p className="text-gray-600">
                  No groups found in your area.
                </p>
              )}
              {nearbyGroups.map((group) => (
                <GroupCard key={group.group_id} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* MY EVENTS SECTION */}
        {!isLoggedOut() && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-3">
              My Events →
            </h2>

            {loading && <p className="text-gray-700">Loading events...</p>}
            {error && (
              <p className="text-red-600">
                Error: {error}
              </p>
            )}

            <div className="flex flex-wrap gap-5">
              {!loading && !error && myEvents.length === 0 && (
                <p className="text-gray-600">
                  You haven't RSVP'd to any events yet.
                </p>
              )}
              {myEvents.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* MY GROUP EVENTS SECTION */}
        {!isLoggedOut() && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-3">
              My Group Events →
            </h2>

            {loading && <p className="text-gray-700">Loading events...</p>}
            {error && (
              <p className="text-red-600">
                Error: {error}
              </p>
            )}

            <div className="flex flex-wrap gap-5">
              {!loading && !error && groupEvents.length === 0 && (
                <p className="text-gray-600">
                  No upcoming events from your groups.
                </p>
              )}
              {groupEvents.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* footer */}
      <footer className="fixed bottom-0 right-0 px-8 py-5 text-right z-10">
        <div className="flex flex-col gap-1">
          <a href="/about-us" className="text-green-700 no-underline hover:underline">
            About Us
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;