import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';

const placeholderImg = "https://picsum.photos/800/400";

const EventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${apiURL}/events/${eventId}`);
        if (!response.ok) throw new Error('Failed to load event');
        
        const data = await response.json();
        setEvent(data);
        setEditForm(data);

        // check if user is creator
        if (!isLoggedOut()) {
          setIsCreator(data.creator_id === getAuthToken().user.uid);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiURL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken().JWT}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Failed to update event');
      
      const updated = await response.json();
      setEvent(updated);
      setEditForm(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditForm(event);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error && !event) return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <p className="text-red-600 mb-4">{error}</p>
      <button onClick={() => navigate('/home')} className="px-4 py-2 bg-green-700 text-white rounded">
        Back to Home
      </button>
    </div>
  );
  if (!event) return null;

  const eventTime = event.event_time ? event.event_time.substring(0, 5) : '';
  const location = `${event.address}, ${event.city}, ${event.state}${event.zip ? ' ' + event.zip : ''}, ${event.country}`;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <button onClick={() => navigate('/home')} className="mb-6 text-green-700">
        ← Back to Home
      </button>

      {/* event header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <img src={event.image_url || placeholderImg} alt={event.title} className="w-full h-64 object-cover" />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editForm.title || ''}
                  onChange={handleChange}
                  className="text-3xl font-bold text-green-700 w-full border rounded px-3 py-2 mb-2"
                />
              ) : (
                <h1 className="text-3xl font-bold text-green-700 mb-2">{event.title}</h1>
              )}
              <p className="text-gray-600 text-sm">
                Hosted by <span className="font-semibold">{event.group_name}</span>
              </p>
            </div>
            
            {/* edit button */}
            {isCreator && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-green-700 text-white rounded">
                Edit Event
              </button>
            )}
          </div>

          {/* date & time */}
          <div className="mb-3">
            <span className="text-gray-700 font-semibold">Date & Time: </span>
            {isEditing ? (
              <span>
                <input type="date" name="event_date" value={editForm.event_date || ''} onChange={handleChange} className="border rounded px-3 py-1 mr-2" />
                <input type="time" name="event_time" value={editForm.event_time?.substring(0, 5) || ''} onChange={handleChange} className="border rounded px-3 py-1" />
              </span>
            ) : (
              <span>{new Date(event.event_date).toLocaleDateString()}{eventTime && ` at ${eventTime}`}</span>
            )}
          </div>

          {/* location */}
          <div>
            <span className="text-gray-700 font-semibold">Location: </span>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <input type="text" name="address" value={editForm.address || ''} onChange={handleChange} placeholder="Address" className="w-full border rounded px-3 py-1" />
                <div className="flex gap-2">
                  <input type="text" name="city" value={editForm.city || ''} onChange={handleChange} placeholder="City" className="flex-1 border rounded px-3 py-1" />
                  <input type="text" name="state" value={editForm.state || ''} onChange={handleChange} placeholder="State" className="flex-1 border rounded px-3 py-1" />
                  <input type="text" name="zip" value={editForm.zip || ''} onChange={handleChange} placeholder="ZIP" className="w-24 border rounded px-3 py-1" />
                </div>
                <input type="text" name="country" value={editForm.country || ''} onChange={handleChange} placeholder="Country" className="w-full border rounded px-3 py-1" />
              </div>
            ) : (
              <span>{location}</span>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="px-6 py-2 bg-green-700 text-white rounded">Save</button>
              <button onClick={handleCancel} className="px-6 py-2 bg-gray-300 rounded">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* description */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">About This Event</h2>
        {isEditing ? (
          <textarea name="description" value={editForm.description || ''} onChange={handleChange} rows="6" className="w-full border rounded px-3 py-2" />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
        )}
      </div>

      {/* group info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">About the Group</h2>
        <p className="font-semibold mb-2">{event.group_name}</p>
        {event.group_description && <p className="text-gray-600">{event.group_description}</p>}
      </div>
    </div>
  );
};

export default EventPage;