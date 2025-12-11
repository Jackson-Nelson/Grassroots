import React, { useState, Fragment, useRef, useEffect } from 'react';
import { Users, Plus, X, UserPlus, Send, MessageCircle } from 'lucide-react';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';

// Mock getAuthToken function for demo
// const getAuthToken = () => ({ JWT: 'demo-token', uid: 'user-123' });


export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', tags: [] });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedGroup]);


  // load all groups I am a member of
  useEffect(() => {

    document.title = 'My Groups -- Grassroots'

    const fetchGroups = async () => {
      const request = new Request(`${apiURL}/groups/my-groups/`, {
        headers: {
          "Authorization": "Bearer " + getAuthToken().JWT
        }
      });

      try {
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error('Failed getting my groups: ' + response.text());
        }

        const dbGroups = await response.json();
        console.log(dbGroups)
        setGroups(dbGroups.map((g) => {
          return {
            ...g,
            id: g.group_id,
          };
        }));
      } catch (err) {
        console.error(err);
      }
    }

    if (!isLoggedOut())
      fetchGroups();
  }, []);

  // load messages when I open a group
  useEffect(() => {
    const getMessageHistory = async () => {
      console.log(`getting msg history from group: ${selectedGroup.id}`)
      const request = new Request(`${apiURL}//message-history?channelId=${selectedGroup.id}`,
        {
          headers: {
            "Authorization": "Bearer " + getAuthToken().JWT
          },
        })

      try {
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const msgs = await response.json();

        setMessages(msgs.map((msg) => {
          return {
            id: msg.message_id,
            user: msg.username,
            text: msg.content,
            timestamp: msg.created_at,
          };
        }))

        console.log(msgs)
        console.log(msgs.map((msg) => {
          return {
            id: msg.message_id,
            user: msg.username,
            text: msg.content,
            timestamp: msg.created_at,
          };
        })
        )
        console.log(messages);

      } catch (err) {
        console.error(err);
      }
    }

    // only get message history if selectedGroup is valid
    if (false) {
      getMessageHistory();
    }
  }, [selectedGroup]);

  const createGroup = async () => {
    const request = new Request(`${apiURL}/groups/create`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getAuthToken().JWT
      },
      body: JSON.stringify({
        name: newGroup.name,
        desc: newGroup.description,
        tags: newGroup.tags,
        contact_email: newGroup.contact_email,
        contact_phone: newGroup.contact_phone,
        // creator_id: getAuthToken().uid
      })
    });

    try {
      const response = await fetch(request);
      if (!response.ok) throw new Error('Error: ' + await response.text());

      const newGroupData = {
        id: (await response.json()).gid,
        name: newGroup.name,
        description: newGroup.description,
        tags: newGroup.tags,
        members: []
      };

      setGroups([...groups, newGroupData]);
      setMessages([...messages]);
      setNewGroup({ name: '', description: '', tags: [] });
      setTagInput('');
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      // For demo purposes, still create the group locally
      const newGroupData = {
        id: Date.now(),
        name: newGroup.name,
        description: newGroup.description,
        tags: newGroup.tags,
        members: []
      };

      setGroups([...groups, newGroupData]);
      setMessages([...messages]);
      setNewGroup({ name: '', description: '', tags: [] });
      setTagInput('');
      setShowCreateModal(false);
    }
  };

  const joinGroup = (groupId) => {
    if (memberName.trim()) {
      const updatedGroups = groups.map(group =>
        group.id === groupId
          ? { ...group, members: [...group.members, memberName] }
          : group
      );
      setGroups(updatedGroups);
      setCurrentUser(memberName);

      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(updatedGroups.find(g => g.id === groupId));
      }

      setMemberName('');
    }
  };

  const sendMessage = () => {
    const sendMsg = async () => {
      console.log("tried to send a message")
      if (messageInput.trim() && currentUser && selectedGroup) {
        const request = new Request(`${apiURL}/groups/${selectedGroup.id}/send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getAuthToken().JWT
          },
          body: JSON.stringify({
            content: messageInput.trim()
          })
        });

        try {
          const response = await fetch(request);

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const newMessage = {
            id: await response.json().message_id,
            user: currentUser,
            text: messageInput.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages([
            ...messages,
          ]);
          setMessageInput('');
        } catch (err) {
          console.err(err);

        }
      }
    };
    sendMsg();
  }

  const goBack = () => {
    setSelectedGroup(null);
    setMessageInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !newGroup.tags.includes(tagInput.trim())) {
      setNewGroup({ ...newGroup, tags: [...newGroup.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewGroup({ ...newGroup, tags: newGroup.tags.filter(tag => tag !== tagToRemove) });
  };

  // Homepage View
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-green-900 mb-3">Grassroots</h1>
            <p className="text-xl text-green-600">The best way to get politically active in your community</p>
          </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed top-20 right-8 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-all flex items-center gap-2 font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>

          {groups.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-md">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No groups yet</p>
              <p className="text-gray-400">Click "Create Group" to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <div
                  key={group.id}
                  // onClick={() => setSelectedGroup(group)}
                  onClick={() => window.location.href = `/groups/${group.id}`}
                  className="bg-white rounded-lg p-6 cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-3">
                    {group.description || 'No description provided'}
                  </p>
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {group.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Create New Group</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Enter group name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="What's this group about?"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={newGroup.contact_email || ''}
                      onChange={(e) => setNewGroup({ ...newGroup, contact_email: e.target.value })}
                      placeholder="group@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={newGroup.contact_phone || ''}
                      onChange={(e) => setNewGroup({ ...newGroup, contact_phone: e.target.value })}
                      placeholder="(123) 456-7890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {newGroup.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newGroup.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center gap-2">
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createGroup}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group Detail View with Chat
  const groupMessages = messages;
  const isMember = selectedGroup.members.includes(currentUser);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={goBack}
          className="mb-6 text-green-600 hover:text-green-800 font-medium flex items-center gap-2"
        >
          ← Back to Groups
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <Users className="w-7 h-7 text-green-600" />
                  {selectedGroup.name}
                </h1>
                <p className="text-gray-600 text-sm">{selectedGroup.description}</p>
              </div>

              {selectedGroup.tags && selectedGroup.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedGroup.members.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Members ({selectedGroup.members.length}):
                  </p>
                  <div className="space-y-2">
                    {selectedGroup.members.map((member, idx) => (
                      <div key={idx} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {member}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join this group
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                      placeholder="Enter your name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => joinGroup(selectedGroup.id)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Join Group
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Group Chat
                </h2>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>No messages yet. {isMember ? 'Start the conversation!' : 'Join the group to chat.'}</p>
                  </div>
                ) : (
                  groupMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.user === currentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.user === currentUser
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {msg.user}
                        </p>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs mt-1 opacity-60">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {isMember ? (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-center text-gray-500 text-sm">
                    Join the group to participate in the chat
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
