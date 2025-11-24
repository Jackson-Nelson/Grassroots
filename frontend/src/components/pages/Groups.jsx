import React, { useState, Fragment } from 'react';
import { Users, Plus, X, UserPlus } from 'lucide-react';
import { getAuthToken } from '../../App';
// import './App.css';

// Components
// import Homepage from "./Homepage";

// function App() {
//   return (
//     <Fragment>
//     <Homepage />
//   </Fragment>
//   );
// }

const apiURL = 'http://localhost:4000/api'

export default function Groups() {

  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', tags: [] });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [tagInput, setTagInput] = useState('');


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
        creator_id: getAuthToken().uid
      })
    })
    
    console.log(JSON.stringify({      body: {
        "name": newGroup.name,
        "desc": newGroup.description,
        "tags": newGroup.tags,
        "creator_id": getAuthToken.uid
      }}))

    try {
      const response = await fetch(request);

      if (!response.ok) throw new Error('Error: ' + await response.text());

      // setGroups([...groups, ])
      setNewGroup({ name: '', description: '', tags: [] });
      setTagInput('');
      setShowCreateModal(false);

    }catch(err){
      console.error(err);
    }


  }


  // const createGroup = () => {
  //   if (newGroup.name.trim()) {
  //     setGroups([...groups, {
  //       id: Date.now(),
  //       name: newGroup.name,
  //       description: newGroup.description,
  //       tags: newGroup.tags,
  //       members: []
  //     }]);
  //     setNewGroup({ name: '', description: '', tags: [] });
  //     setTagInput('');
  //     setShowCreateModal(false);
  //   }
  // };

  const joinGroup = (groupId) => {
    if (memberName.trim()) {
      const updatedGroups = groups.map(group =>
        group.id === groupId
          ? { ...group, members: [...group.members, memberName] }
          : group
      );
      setGroups(updatedGroups);

      // Update the selected group to show the new member immediately
      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(updatedGroups.find(g => g.id === groupId));
      }

      setMemberName('');
    }
  };

  const goBack = () => {
    setSelectedGroup(null);
    setMemberName('');
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-900 mb-3">Grassroots</h1>
          <p className="text-xl text-green-600">The best way to get politically active in your community</p>
        </div>

        {/* Create Group Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed top-8 right-8 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-all flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No groups yet</p>
            <p className="text-gray-400">Click "Create Group" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-white rounded-lg p-6 cursor-pointer"
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

        {/* Create Group Modal */}
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
    );
  }

  // Group Detail View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={goBack}
          className="mb-6 text-green-600 hover:text-green-800 font-medium flex items-center gap-2"
        >
          ← Back to Groups
        </button>

        <div className="bg-white rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              {selectedGroup.name}
            </h1>
            <p className="text-gray-600">{selectedGroup.description}</p>
          </div>

          {/* Members List */}
          {selectedGroup.members.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Members ({selectedGroup.members.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedGroup.members.map((member, idx) => (
                  <span key={idx} className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Join Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join this group
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                placeholder="Enter your name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => joinGroup(selectedGroup.id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}