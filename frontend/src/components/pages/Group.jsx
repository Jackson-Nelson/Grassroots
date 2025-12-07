import React, { useState, Fragment, useRef, useEffect } from 'react';
import { Users, Plus, X, UserPlus, Send, MessageCircle } from 'lucide-react';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';
import { useParams } from 'react-router-dom';



// Mock getAuthToken function for demo
// const getAuthToken = () => ({ JWT: 'demo-token', uid: 'user-123' });


export default function GroupPage() {
  // const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(getAuthToken().user);
  const [iAmMember, setIAmMember] = useState(false);
  const messagesEndRef = useRef(null);

  const groupId = useParams().groupId;


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedGroup]);

  // get group info when you go to group's page
  useEffect(() => {
    const getGroupInfo = async () => {
      const request = new Request(`${apiURL}/group/${groupId}`);

      try {

        const response = await fetch(request)

        if (!response.ok) {
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

        setSelectedGroup({
          ...groupInfo,
          id: groupInfo.group_id
        })

        setIAmMember(!isLoggedOut() && groupInfo.members.find((memb) => memb.user_id === getAuthToken().user.uid))

      } catch (err) {
        console.err("Error fetching group info: " + err);
      }
    }

    if (groupId)
      getGroupInfo();
  }, [])


  // load messages when I open a group
  useEffect(() => {
    const getMessageHistory = async () => {
      console.log(`getting msg history from group: ${selectedGroup.id}`)
      const request = new Request(`${apiURL}/groups/message-history?groupId=${selectedGroup.id}`,
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
            user: {username:msg.username, uid:msg.user_id, email:msg.email},
            text: msg.content,
            timestamp: msg.created_at,
          };
        }))

        console.log(msgs)
        console.log(msgs.map((msg) => {
          return {
            id: msg.message_id,
            user: {username:msg.username, uid:msg.user_id, email:msg.email},
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
    if (selectedGroup) {
      getMessageHistory();
    }
  }, [selectedGroup]);


  const joinGroup = (groupId) => {
    if (memberName.trim()) {

      // setSelectedGroup({...selectedGroup, members: [...selectedGroup.members, getAuthToken().user.username]})
      // setCurrentUser(memberName);
      setIAmMember(true);

      setMemberName('');
    }
  };

  const sendMessage = () => {
    const sendMsg = async () => {
      console.log("tried to send a message")
      if (messageInput.trim() && !isLoggedOut() && selectedGroup) {
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
            user: getAuthToken().user,
            text: messageInput.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages([
            ...messages, newMessage
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
    window.location.href = "/groups";
  };

if(!selectedGroup){
  return <div className='center'>Loading...</div>
}

  // Group Detail View with Chat
  const groupMessages = messages;
  const isMember = iAmMember;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 p-8">
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
                        {member.username}
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
