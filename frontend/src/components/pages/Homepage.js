import React, { useState, useEffect } from 'react';

const styles = {
  card: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    width: '30%',
    marginBottom: '20px'
  },
  cardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  cardBody: {
    padding: '15px'
  },
  cardTitle: {
    color: '#5a8f3d',
    margin: '0 0 10px 0'
  }
};

const placeholderImg = "https://picsum.photos/400/300";

const EventCard = ({ event }) => (
  <div style={styles.card}>
    <img src={event.image_url || placeholderImg} alt={event.title} style={styles.cardImage} />
    <div style={styles.cardBody}>
      <h5 style={styles.cardTitle}>
        {new Date(event.date).toLocaleDateString()} {event.title}
      </h5>
      {event.location && <p style={{ color: '#666' }}>{event.location}</p>}
      {event.description && <p>{event.description}</p>}
    </div>
  </div>
);

const GroupCard = ({ group }) => (
  <div style={styles.card}>
    <img src={group.image_url || placeholderImg} alt={group.name} style={styles.cardImage} />
    <div style={styles.cardBody}>
      <h5 style={styles.cardTitle}>{group.name}</h5>
      {group.member_count && <p style={{ color: '#666' }}>{group.member_count} members</p>}
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
        const eventsRes = await fetch('/api/events/nearby');
        const groupsRes = await fetch('/api/groups/my-groups');
        
        if (!eventsRes.ok || !groupsRes.ok) throw new Error('Failed to fetch data');
        
        setEvents(await eventsRes.json());
        setGroups(await groupsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #ddd', padding: '10px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: '2rem', marginRight: '10px' }}>🌱</span>
            <span style={{ color: '#5a8f3d', fontSize: '1.8rem', fontWeight: 'bold' }}>Grassroots</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="search" 
                placeholder="Search Groups, Events, Discussions..." 
                style={{ width: '320px', padding: '8px 40px 8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button style={{ 
                position: 'absolute', 
                right: '5px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                padding: '4px 10px', 
                border: 'none', 
                background: 'transparent',
                fontSize: '20px',
                cursor: 'pointer'
              }}>+</button>
            </div>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span style={{ color: '#5a8f3d' }}>my_username</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#5a7a5a' }}></div>
            </a>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', width: '100%' }}>
        
        {/* EVENTS SECTION */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ color: '#5a8f3d', marginBottom: '20px' }}>Events Near Me →</h2>
          {loading && <p>Loading events...</p>}
          {error && <p style={{ color: '#dc3545' }}>Error: {error}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {!loading && !error && events.length === 0 && <p>No upcoming events found.</p>}
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </div>

        {/* GROUPS SECTION */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ color: '#5a8f3d', marginBottom: '20px' }}>My Groups →</h2>
          {loading && <p>Loading groups...</p>}
          {error && <p style={{ color: '#dc3545' }}>Error: {error}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {!loading && !error && groups.length === 0 && <p>You haven't joined any groups yet.</p>}
            {groups.map(group => <GroupCard key={group.id} group={group} />)}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'right', padding: '20px 30px', marginTop: 'auto' }}>
        <div><a href="#" style={{ color: '#5a8f3d', textDecoration: 'none' }}>About Us</a></div>
        <div><a href="#" style={{ color: '#5a8f3d', textDecoration: 'none' }}>Contact</a></div>
        <div><a href="#" style={{ color: '#5a8f3d', textDecoration: 'none' }}>Tutorial</a></div>
        <div><a href="#" style={{ color: '#5a8f3d', textDecoration: 'none' }}>Language ⌄</a></div>
      </div>
    </div>
  );
};

export default Homepage;