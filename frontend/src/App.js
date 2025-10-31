import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, MessageSquare, ChevronRight, Menu, X, Home, Map, UserCircle, Plus, LogOut, Edit, Trash2, Clock, Send } from 'lucide-react';

// Add Tailwind CSS
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
document.head.appendChild(style);

const API_URL = 'http://localhost:3000/api';

// Utility function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Login/Register Component
const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    location: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">Grassroots</h1>
        <p className="text-gray-600 mb-6">Connect. Organize. Make a difference.</p>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md transition ${isLogin ? 'bg-white shadow' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-md transition ${!isLogin ? 'bg-white shadow' : ''}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

          {!isLogin && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                type="text"
                placeholder="Location (City, State)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-500">Location can be changed once every 6 months to prevent spam.</p>
            </>
          )}

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentPage, onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'groups', icon: Users, label: 'My Groups' },
    { id: 'map', icon: Map, label: 'Interactive Map' },
    { id: 'forum', icon: MessageSquare, label: 'Location Forums' }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${isOpen ? 'left-0' : '-left-64'} lg:left-0 w-64`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => onNavigate('home')}>
            Grassroots
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentPage === item.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle size={32} className="text-gray-600" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// Home Page
const HomePage = ({ onNavigate, user }) => {
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const groupsData = await apiCall('/groups');
      setGroups(groupsData.groups || []);

      // Get events from all groups
      const allEvents = [];
      for (const group of groupsData.groups || []) {
        try {
          const eventsData = await apiCall(`/groups/${group.group_id}/events`);
          allEvents.push(...(eventsData.events || []).map(e => ({ ...e, group_name: group.name })));
        } catch (err) {
          console.error('Error loading events:', err);
        }
      }
      setEvents(allEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = events.filter(e =>
    new Date(e.event_date) >= new Date() && !e.is_cancelled
  ).slice(0, 6);

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search groups and events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={() => onNavigate('create-group')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Create Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h2>
          <p className="text-indigo-100">Discover local groups and events in your community</p>
        </div>

        {/* Upcoming Events */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Upcoming Events Near You
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500">No upcoming events</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <div key={event.event_id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    <Calendar size={18} className="text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.group_name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Clock size={14} />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{event.attendee_count} attending</span>
                    <button className="text-indigo-600 text-sm font-semibold hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Groups */}
        <section>
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-indigo-600" />
            Groups in Your Area
          </h3>
          {filteredGroups.length === 0 ? (
            <p className="text-gray-500">No groups found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.group_id}
                  onClick={() => onNavigate('group', group.group_id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{group.name}</h4>
                    <Users size={18} className="text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {group.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{group.member_count} members</span>
                    <span>{group.event_count} events</span>
                  </div>
                  {group.is_member && (
                    <div className="mt-3 px-3 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-full inline-block">
                      Member
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Group Detail Page
const GroupDetailPage = ({ groupId, onBack, user }) => {
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const groupData = await apiCall(`/groups/${groupId}`);
      setGroup(groupData.group);

      const eventsData = await apiCall(`/groups/${groupId}/events`);
      setEvents(eventsData.events || []);

      const messagesData = await apiCall(`/groups/${groupId}/messages`);
      setMessages(messagesData.messages || []);
    } catch (err) {
      console.error('Error loading group:', err);
    }
  };

  const handleJoinLeave = async () => {
    try {
      if (group.user_role) {
        await apiCall(`/groups/${groupId}/leave`, { method: 'POST' });
      } else {
        await apiCall(`/groups/${groupId}/join`, { method: 'POST' });
      }
      loadGroupData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await apiCall(`/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage })
      });
      setNewMessage('');
      loadGroupData();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!group) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={onBack} className="text-indigo-600 mb-3 flex items-center gap-1 hover:underline">
            ← Back to Home
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
              <p className="text-gray-600">{group.description}</p>
              <p className="text-sm text-gray-500 mt-2">{group.members?.length} members</p>
            </div>
            <button
              onClick={handleJoinLeave}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                group.user_role
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {group.user_role ? 'Leave Group' : 'Join Group'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-6">
          {['chat', 'events', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 border-b-2 transition capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.message_id} className="flex gap-3">
                    <UserCircle size={32} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {group.user_role && (
              <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Send size={18} />
                  Send
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-gray-500">No events scheduled</p>
            ) : (
              events.map((event) => (
                <div key={event.event_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} />
                      <span>{event.attendee_count} attending</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Members ({group.members?.length})</h3>
            <div className="space-y-3">
              {group.members?.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCircle size={40} className="text-gray-400" />
                    <div>
                      <p className="font-semibold">{member.username}</p>
                      {member.full_name && <p className="text-sm text-gray-500">{member.full_name}</p>}
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full capitalize">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Group Page
const CreateGroupPage = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiCall('/groups', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-indigo-600 mb-6 flex items-center gap-1 hover:underline">
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">Create a New Group</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Group Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={5}
                placeholder="Tell people what your group is about..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Create Group
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Simple placeholder pages
const MapPage = () => (
  <div className="flex-1 bg-gray-50 p-6">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Interactive Map</h2>
      <div className="bg-white rounded-lg shadow p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <Map size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Interactive map showing nearby organizations and events</p>
          <p className="text-sm text-gray-500 mt-2">(Map integration coming soon)</p>
        </div>
      </div>
    </div>
  </div>
);

const ForumPage = () => (
  <div className="flex-1 bg-gray-50 p-6">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Location Forums</h2>
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Share local news, events, and connect with your community</p>
          <p className="text-sm text-gray-500 mt-2">(Forum feature coming soon)</p>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  const handleNavigate = (page, groupId = null) => {
    setCurrentPage(page);
    setSelectedGroupId(groupId);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} user={user} />}
      {currentPage === 'groups' && <HomePage onNavigate={handleNavigate} user={user} />}
      {currentPage === 'group' && (
        <GroupDetailPage
          groupId={selectedGroupId}
          onBack={() => handleNavigate('home')}
          user={user}
        />
      )}
      {currentPage === 'create-group' && (
        <CreateGroupPage
          onBack={() => handleNavigate('home')}
          onSuccess={() => handleNavigate('home')}
        />
      )}
      {currentPage === 'map' && <MapPage />}
      {currentPage === 'forum' && <ForumPage />}
    </div>
  );
}