import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';
import getLocale from '../../utils/getcoords';

const placeholderImg = "https://picsum.photos/400/300";

const GroupCard = ({ group }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 rounded-md overflow-hidden w-full bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <img
        src={group.avatar_url || placeholderImg}
        alt={group.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h5 className="text-green-700 font-bold mb-2 text-lg">
          {group.name}
        </h5>
        {group.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-3">{group.description}</p>
        )}
        <p className="text-gray-500 text-sm">
          {group.city}, {group.state}
        </p>
      </div>
    </div>
  );
};

const NearbyGroups = () => {
  const [nearbyGroups, setNearbyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUserLoc, setUserLoc] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Groups Near Me -- Grassroots';

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

        // fetch nearby groups
        const nearbyGroupsUrl = new URL(`${apiURL}/groups/nearby`);
        nearbyGroupsUrl.searchParams.append('city', hasUserLoc.city);
        nearbyGroupsUrl.searchParams.append('state', hasUserLoc.state);
        nearbyGroupsUrl.searchParams.append('country', hasUserLoc.country);

        const nearbyGroupsRes = await fetch(nearbyGroupsUrl);
        if (!nearbyGroupsRes.ok) {
          const errorText = await nearbyGroupsRes.text();
          throw new Error(`Failed to fetch groups: ${nearbyGroupsRes.status} ${errorText}`);
        }
        const nearbyGroupsData = await nearbyGroupsRes.json();
        setNearbyGroups(nearbyGroupsData);

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
            Groups Near Me
          </h1>

          {loading && <p className="text-gray-700">Loading groups...</p>}
          {error && (
            <p className="text-red-600">
              Error: {error}
            </p>
          )}

          {!loading && !error && nearbyGroups.length === 0 && (
            <p className="text-gray-600">
              No groups found in your area.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nearbyGroups.map((group) => (
              <GroupCard key={group.group_id} group={group} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default NearbyGroups;
