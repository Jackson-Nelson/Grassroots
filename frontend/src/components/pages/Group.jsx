import React, { useState, Fragment, useRef, useEffect } from 'react';
import { Users, Plus, X, UserPlus, Send, MessageCircle, Calendar, Hash, CalendarDays, BarChart3, FolderOpen, PlusSquare } from 'lucide-react';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';
import { useParams } from 'react-router-dom';
import { useContext } from 'react';
import { SideBarItemsContext } from '../Sidebar';
import { EventCard } from './Homepage';
import PollsPane from './Polls';





export default function GroupPage() {
  // const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(getAuthToken().user || {uid:'',username:'', email:''});
  const [iAmMember, setIAmMember] = useState(false);
  const messagesEndRef = useRef(null);
  const [showingPane, setShowingPane] = useState('');
  const [sidebarButtonPressed, setSidebarPressed] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);

  const groupId = useParams().groupId;

  const { addSidebarCluster, removeSidebarCluster } = useContext(SideBarItemsContext);

  const EventsPane = () => {
    return (
      // <div className='absolute bg-white rounded overflow-clip shadow max-h-[70%] mt-8 pt-[10px]'>
      <div className='absolute bg-white rounded shadow mt-8 h-[85%]  flex flex-col align-center overflow-y-scroll  p-3 no-scrollbar '>

          {!isLoggedOut() &&
            <div className="flex flex-col gap-2 m-[10px] mb-[calc(3+10px)]">
              {/* <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        /> */}
              <button
                onClick={() => { window.location.href = `/events/new?groupId=${selectedGroup.id}` }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>
          }
          {"Upcoming events:"}
          {selectedGroup.events.length === 0 ? "No upcoming events."
            : selectedGroup.events.map((event) => {
              return (<div>
                <EventCard event={event} />
              </div>
              )
            })}
        </div>
      // </div>
    )
  }
  const ChannelsPane = () => {
    return (
      // <div className=''>
      <div className=' absolute bg-white rounded shadow h-[85%] mt-8 pt-[10px] max-h-full  flex flex-col align-center overflow-y-scroll  p-3 no-scrollbar '>

          {!isLoggedOut() &&
            <div className="flex flex-col gap-2 ">
              {/* <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        /> */}
              <button
                onClick={() => { }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                <Plus className="w-4 h-4" />
                Create Channel
              </button>
            </div>
          }
          Channels:
          {selectedGroup.channels.length === 0 ? "No channels? 🤨"
            : selectedGroup.channels.map((channel) => {
              return (<div className='flex flex-row items-center mt-[10px] shadow rounded from-blue-50 to-green-100 hover:bg-green-50 cursor-pointer' onClick={() => setSelectedChannel(channel)}>
                <Hash className='mx-1 w-4 h-4'/>
                <div>{channel.name}</div>
              </div>
              )
            })}
        </div>
      // </div>
    )
  }


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  useEffect(() => {
    if(!sidebarButtonPressed) return;

    if (showingPane === sidebarButtonPressed) {
      setShowingPane('');
    } else {
      setShowingPane(sidebarButtonPressed);
    }

    setSidebarPressed(false);
  }, [sidebarButtonPressed])

  // triggers after group loads
  useEffect(() => {
    if (!selectedGroup) return;



    const GROUPS_PAGE_ITEMS = [
      { icon: Hash, label: "Channels", onClick: (() => setSidebarPressed('channels')) },
      { icon: CalendarDays, label: "Group Events", onClick: (() => setSidebarPressed('events')) },
      { icon: BarChart3, label: "Polls", onClick: (() => setSidebarPressed('polls')) },
    ]

    addSidebarCluster({ groupLabel: selectedGroup.name, menuItems: GROUPS_PAGE_ITEMS })
    console.log("RAN CONTENT")
    // return () =>{ removeSidebarCluster(selectedGroup.name);console.log("RAN CLEANUP");}

  }, [selectedGroup]);

  // EDITING THE GROUP PAGE
  const handleSave = async () => {
    try {
      const response = await fetch(`${apiURL}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken().JWT}`
        },
        body: JSON.stringify({...editForm})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update group' }));
        const errorMessage = errorData.details || errorData.error || `Failed to update group (${response.status})`;
        console.error('Backend error response:', errorData);
        throw new Error(errorMessage);
      }
      
      const updated = await response.json();
      setSelectedGroup(updated);
      setEditForm(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
      console.error('Error updating group:', err);
    }
  };

  const handleCancel = () => {
    setEditForm(selectedGroup);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleTagsChange = (e) => {
    // tags r separated by commas, convert to array
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setEditForm({ ...editForm, tags: tagsArray });
  };




  // get group info when you go to group's page
  useEffect(() => {
    const getGroupInfo = async () => {
      const request = new Request(`${apiURL}/group/${groupId}`);

      try {

        const response = await fetch(request)

        if (!response.ok) {
          document.title = 'Failed to load group -- Grassroots'

          switch (response.status) {
            case 404:
              throw new Error(`Group by ID ${groupId} does not exist.`);
            case 500:
              throw new Error('internal server error.');
            default:
              throw new Error(await response.text());
          }
        }
        
        const groupInfo = await response.json();
        console.log("group data:");
        console.log(groupInfo)

        document.title = groupInfo.name + ' -- Grassroots'
        
        setSelectedGroup({
          ...groupInfo,
          id: groupInfo.group_id
        })
        setEditForm(groupInfo);

        setSelectedChannel(groupInfo.channels.find((c) => c.name === 'default') || groupInfo.channels[0]);

        setIAmMember(!isLoggedOut() && groupInfo.members.find((memb) => memb.user_id === getAuthToken().user.uid))
        
        // Check if user is creator
        if (!isLoggedOut()) {
          setIsCreator(groupInfo.creator_id === getAuthToken().user.uid);
        }

      } catch (err) {
        console.error("Error fetching group info: " + err);
      }
    }

    if (groupId)
      getGroupInfo();
  }, [])


  // load messages when I open a group
  useEffect(() => {
    const getMessageHistory = async () => {
      console.log(`getting msg history from channel: ${selectedChannel.name}`)
      const request = new Request(`${apiURL}/messages/history/${selectedChannel.channel_id}`,
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
            user: { username: msg.username, uid: msg.user_id, email: msg.email },
            text: msg.content,
            timestamp: msg.created_at,
          };
        }))

        // console.log(msgs)
        // console.log(msgs.map((msg) => {
        //   return {
        //     id: msg.message_id,
        //     user: { username: msg.username, uid: msg.user_id, email: msg.email },
        //     text: msg.content,
        //     timestamp: msg.created_at,
        //   };
        // })
        // )
        console.log(messages);

      } catch (err) {
        console.error(err);
      }
    }

    // only get message history if selectedGroup is valid
    if (selectedChannel) {
      getMessageHistory();
    }
  }, [selectedChannel]);


  const joinGroup = (groupId) => {
    const joinTheGroup = async () => {

      const request = new Request(`${apiURL}/groups/${groupId}/join`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getAuthToken().JWT
        }
      })
      try {
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setIAmMember(true);
        setSelectedGroup({ ...selectedGroup, members: [...selectedGroup.members, getAuthToken().user] })


      } catch (err) {
        console.error("Error joining group:" + err);
      }

    };
    joinTheGroup();
  }
  const leaveGroup = (groupId) => {
    const leaveTheGroup = async () => {

      const request = new Request(`${apiURL}/groups/${groupId}/leave`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getAuthToken().JWT
        }
      })
      try {
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setIAmMember(false);
        setSelectedGroup({ ...selectedGroup, members: selectedGroup.members.filter(memb => memb.user_id != getAuthToken().user.uid) })


      } catch (err) {
        console.error("Error leaveing group:" + err);
      }

    };
    leaveTheGroup();
  }

  const sendMessage = () => {
    const sendMsg = async () => {
      console.log("tried to send a message")
      if (messageInput.trim() && !isLoggedOut() && selectedChannel) {
        const request = new Request(`${apiURL}/messages/${selectedChannel.channel_id}/send`, {
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
            user: getAuthToken().user,
            text: messageInput.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages([
            ...messages, newMessage
          ]);
          setMessageInput('');
        } catch (err) {
          console.error(err);

        }
      }
    };
    sendMsg();
  }

  const goBack = () => {
    window.location.href = "/groups";
  };

  if (!selectedGroup) {
    return <div className='center'>Loading...</div>
  }

  // Group Detail View with Chat
  const groupMessages = messages;
  const isMember = iAmMember;

  return (
    <div className="min-h-[100vh] bg-gray-50 px-8" onClick={() => setShowingPane('')}>

      {showingPane === 'events' && <EventsPane />}
      {showingPane === 'channels' && <ChannelsPane />}
      {showingPane === 'polls' && <PollsPane groupId={selectedGroup.id} />}

      <div className="max-w-6xl mx-auto">

        {/* Back to Groups Button and Edit Group Button */}
        <div className="flex justify-between items-center mb-4 mt-2">
          <button
            onClick={goBack}
            className="text-green-600 hover:text-green-800 font-medium flex items-center gap-2"
          >
            ← Back to Groups
          </button>

          {/* Edit Group Button */}
          {isCreator && !isEditing && (
            <button 
              onClick={() => { setIsEditing(true); setError(null); }} 
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
            >
              Edit Group
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Info Sidebar */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="mb-6">
                  {/* Group Name */}
                  <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <Users className="w-7 h-7 text-green-600" />
                      {isEditing ? (
                        <input
                          name="name"
                          value={editForm.name || ''}
                          onChange={handleChange}
                          className="text-2xl font-bold text-gray-800 border rounded px-3 py-1"
                        />
                      ) : (
                        selectedGroup.name
                      )}
                    </h1>
                  </div>
                  
                  {/* Group Description */}
                  {isEditing ? (
                    <textarea
                      name="description"
                      rows="10"
                      placeholder="Group description"
                      value={editForm.description || ''}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2 mb-3 text-sm"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm mb-3">{selectedGroup.description}</p>
                  )}
                  
                  {/* Contact Us section */}
                  {isEditing ? (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Contact Information:</p>
                      <input
                        type="email"
                        name="contact_email"
                        value={editForm.contact_email || ''}
                        onChange={handleChange}
                        placeholder="Contact Email"
                        className="w-full border rounded px-3 py-1 text-sm"
                      />
                      <input
                        type="tel"
                        name="contact_phone"
                        value={editForm.contact_phone || ''}
                        onChange={handleChange}
                        placeholder="Contact Phone"
                        className="w-full border rounded px-3 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    (selectedGroup.contact_email || selectedGroup.contact_phone) && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Contact Us</p>
                        {selectedGroup.contact_email && (
                          <p className="text-sm text-gray-600">{selectedGroup.contact_email}</p>
                        )}
                        {selectedGroup.contact_phone && (
                          <p className="text-sm text-gray-600">{selectedGroup.contact_phone}</p>
                        )}
                      </div>
                    )
                  )}
                </div>
                
                {/* Tags section */}
                {isEditing ? (
                  <div className="mb-6">
                    <p className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated):</p>
                    <input
                      type="text"
                      value={(editForm.tags || []).join(', ')}
                      onChange={handleTagsChange}
                      placeholder="tag1, tag2, tag3"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                ) : (
                  selectedGroup.tags && selectedGroup.tags.length > 0 && (
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
                  )
                )}

                {/* Save and Cancel Buttons */}
                {isEditing && (
                  <div className="flex gap-3 mb-6">
                    <button onClick={handleSave} className="px-6 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                      Save
                    </button>
                    <button onClick={handleCancel} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">
                      Cancel
                    </button>
                  </div>
                )}
              
                {/* Members */}
                {selectedGroup.members.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Members ({selectedGroup.members.length}):
                    </p>
                    <div className="space-y-2">
                      {selectedGroup.members.map((member, idx) => (
                        <div key={idx} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {member.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              
              {isLoggedOut() ?
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign in to join groups!
                </label>

                : !isMember ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Join this group
                    </label>
                    <div className="flex flex-col gap-2">
                      {/* <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      /> */}
                      <button
                        onClick={() => joinGroup(selectedGroup.id)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Join Group
                      </button>
                    </div>
                  </div>
                )
                  :
                  <div className="flex flex-col gap-2">
                    {/* <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup.id)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      /> */}
                    <button
                      onClick={() => leaveGroup(selectedGroup.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Leave Group
                    </button>
                  </div>
              }
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Group Chat {selectedChannel.name !== 'default' && `: ${selectedChannel.name}`}
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
                      className={`flex ${msg.user.uid === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.user.uid === currentUser.uid
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {msg.user.username}
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