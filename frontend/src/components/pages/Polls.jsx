import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, X, Vote, CheckCircle2, Circle } from 'lucide-react';
import { apiURL, getAuthToken, isLoggedOut } from '../../App';

export default function PollsPane({ groupId }) {
  const [polls, setPolls] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    poll_type: 'single_choice',
    options: ['', ''],
    end_time: '',
  });
  const [loading, setLoading] = useState(true);

  // Fetch all polls for this group
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const request = new Request(`${apiURL}/polls?group_id=${groupId}`, {
          headers: {
            "Authorization": "Bearer " + getAuthToken().JWT
          }
        });

        const response = await fetch(request);
        
        if (!response.ok) {
          throw new Error('Failed to fetch polls');
        }

        const pollsData = await response.json();
        setPolls(pollsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setLoading(false);
      }
    };

    if (!isLoggedOut() && groupId) {
      fetchPolls();
    }
  }, [groupId]);

  const createPoll = async () => {
    if (!newPoll.title.trim() || newPoll.options.filter(o => o.trim()).length < 2) {
      alert('Please provide a title and at least 2 options');
      return;
    }

    if (!newPoll.end_time) {
      alert('Please provide an end time for the poll');
      return;
    }

    try {
      const request = new Request(`${apiURL}/polls/create`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getAuthToken().JWT
        },
        body: JSON.stringify({
          group_id: groupId,
          title: newPoll.title,
          description: newPoll.description,
          poll_type: newPoll.poll_type,
          options: newPoll.options.filter(o => o.trim()),
          end_time: newPoll.end_time,
        })
      });

      const response = await fetch(request);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to create poll: ${errorText}`);
      }

      const createdPoll = await response.json();
      setPolls([createdPoll, ...polls]);
      setNewPoll({
        title: '',
        description: '',
        poll_type: 'single_choice',
        options: ['', ''],
        end_time: '',
      });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll: ' + err.message);
    }
  };

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll({
        ...newPoll,
        options: newPoll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const PollCard = ({ poll }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [hasVoted, setHasVoted] = useState(poll.user_has_voted);
    const [pollResults, setPollResults] = useState(poll.results || []);

    // Update state when poll prop changes (e.g., after refetching)
    useEffect(() => {
      setHasVoted(poll.user_has_voted);
      setPollResults(poll.results || []);
    }, [poll.poll_id, poll.user_has_voted]);

    const toggleOption = (optionId) => {
      if (hasVoted) return;

      if (poll.poll_type === 'single_choice') {
        setSelectedOptions([optionId]);
      } else {
        // multiple_choice
        if (selectedOptions.includes(optionId)) {
          setSelectedOptions(selectedOptions.filter(id => id !== optionId));
        } else {
          setSelectedOptions([...selectedOptions, optionId]);
        }
      }
    };

    const submitVote = async () => {
      if (selectedOptions.length === 0) {
        alert('Please select at least one option');
        return;
      }

      try {
        const request = new Request(`${apiURL}/polls/${poll.poll_id}/vote`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getAuthToken().JWT
          },
          body: JSON.stringify({
            option_ids: selectedOptions
          })
        });

        const response = await fetch(request);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Vote error:', errorText);
          throw new Error('Failed to submit vote');
        }

        const results = await response.json();
        setHasVoted(true);
        setPollResults(results.results);
      } catch (err) {
        console.error('Error submitting vote:', err);
        alert('Failed to submit vote: ' + err.message);
      }
    };

    const totalVotes = pollResults.reduce((sum, option) => sum + parseInt(option.vote_count || 0), 0);
    const isPollActive = !poll.end_time || new Date(poll.end_time) > new Date();

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {poll.title}
            </h3>
            {poll.description && (
              <p className="text-sm text-gray-600 mb-3">{poll.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={`px-2 py-1 rounded ${
                poll.poll_type === 'single_choice' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-purple-50 text-purple-600'
              }`}>
                {poll.poll_type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
              </span>
              {!isPollActive && (
                <span className="px-2 py-1 rounded bg-red-50 text-red-600">
                  Ended
                </span>
              )}
              {totalVotes > 0 && (
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(hasVoted ? pollResults : poll.options).map((option, idx) => {
            const optionId = option.option_id;
            const isSelected = selectedOptions.includes(optionId);
            const voteCount = parseInt(option.vote_count || 0);
            const percentage = hasVoted && totalVotes > 0 
              ? Math.round((voteCount / totalVotes) * 100) 
              : 0;

            return (
              <div
                key={optionId}
                onClick={() => !hasVoted && isPollActive && toggleOption(optionId)}
                className={`relative p-4 border-2 rounded-lg transition-all ${
                  hasVoted
                    ? 'cursor-default'
                    : isPollActive
                    ? 'cursor-pointer hover:border-green-500'
                    : 'cursor-not-allowed opacity-60'
                } ${
                  isSelected && !hasVoted
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute inset-0 bg-green-100 rounded-lg transition-all"
                    style={{ width: `${percentage}%`, opacity: 0.3 }}
                  />
                )}
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!hasVoted && isPollActive && (
                      poll.poll_type === 'single_choice' ? (
                        isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                      )
                    )}
                    <span className="font-medium text-gray-800">
                      {option.option_text}
                    </span>
                  </div>
                  
                  {hasVoted && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!hasVoted && isPollActive && (
          <button
            onClick={submitVote}
            disabled={selectedOptions.length === 0}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Vote className="w-4 h-4" />
            Submit Vote
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      className='absolute bg-white rounded shadow mt-8 h-[85%] flex flex-col overflow-y-scroll p-3 no-scrollbar'
      onClick={(e) => e.stopPropagation()}
    >
      {!isLoggedOut() && (
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Poll
          </button>
        </div>
      )}

      <h3 className="font-semibold text-gray-700 mb-3">Active Polls:</h3>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
          No polls yet. Create one to get started!
        </div>
      ) : (
        polls.map(poll => <PollCard key={poll.poll_id} poll={poll} />)
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Create New Poll</h2>
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
                  Poll Title *
                </label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="What's your question?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  placeholder="Add more context (optional)"
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Type
                </label>
                <select
                  value={newPoll.poll_type}
                  onChange={(e) => setNewPoll({ ...newPoll, poll_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options * (minimum 2)
                </label>
                <div className="space-y-2">
                  {newPoll.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {newPoll.options.length > 2 && (
                        <button
                          onClick={() => removeOption(idx)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors font-medium"
                  >
                    + Add Option
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={newPoll.end_time}
                  onChange={(e) => setNewPoll({ ...newPoll, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createPoll}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Create Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}