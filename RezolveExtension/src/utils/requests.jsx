const API_BASE_URL = 'https://search-backend-1096141023328.us-west1.run.app';
const TESTING_MODE = false; // Set to false to use real API calls
const DEFAULT_USER = 'michael.ross'; // Default user for logging

// Function to get search suggestions
async function getSearchSuggestions(query) {
  try {
    if (TESTING_MODE) {
      // Import dummy data for testing
      const { dummySuggestions } = await import('./data/dummySearchResponse');
      const filteredSuggestions = dummySuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      return filteredSuggestions;
    }

    const response = await fetch(`${API_BASE_URL}/api/suggestions/autofill?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

async function getSearchHistory() {
  let url = `${API_BASE_URL}/history`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching search history:', error);
    return [];
  }
}

// Function to search through user's search history
async function searchUserHistory(searchTerm, userId = null, limit = 50) {
  try {
    const params = new URLSearchParams({
      q: searchTerm,
      limit: limit.toString()
    });

    if (userId) {
      params.set('user_id', userId);
    }

    const response = await fetch(`${API_BASE_URL}/api/search/user_history?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to search user history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.searches || [];
  } catch (error) {
    console.error('Error searching user history:', error);
    return [];
  }
}



// Function to perform search with streaming support
async function performSearch(query, options = {}) {
  const {
    smart_queries = true,
    signal = null,
    onResultsUpdate = null,
    method = 'POST', // 'POST' or 'GET'
    streaming = true,
    generate_response = true,
    followup_flag = false
  } = options;

  if (TESTING_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Import and return dummy data
    const { dummySearchResponse } = await import('./data/dummySearchResponse');
    return dummySearchResponse;
  }

  try {
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    };

    // Add body for POST requests
    if (method === 'POST') {
      const body = {
        query,
        smart_queries,
        streaming
      };

      // Only include flags if they're explicitly set to false
      // Otherwise, let the backend use database values
      if (generate_response === false) {
        body.generate_response = false;
      }
      if (followup_flag === false) {
        body.followup_flag = false;
      }

      requestOptions.body = JSON.stringify(body);
    }

    let url;
    if (method === 'GET') {
      url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
      // Only add flags if they're explicitly set to false
      if (generate_response === false) {
        url += '&generate_response=false';
      }
      if (followup_flag === false) {
        url += '&followup_flag=false';
      }
    } else {
      url = `${API_BASE_URL}/search`;
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let searchResults = { response: {} };
    let lineCount = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        lineCount++;
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue; // Skip empty lines

            // Log the problematic line if it's too long
            if (jsonStr.length > 1000) {
              console.log(`Long JSON string (${jsonStr.length} chars) at line ${lineCount}:`, jsonStr.substring(0, 100) + '...');
            }

            const data = JSON.parse(jsonStr);

            if (data.type === 'small_talk') {
              const smallTalkResult = {
                response: {
                  results: [],
                  summary: data.message,
                  relevant_file_names: []
                }
              };
              if (onResultsUpdate) onResultsUpdate(smallTalkResult);
              return smallTalkResult;
            }

            switch (data.type) {
              case 'search_started':
                console.log('Search started with ID:', data.data.search_id);
                searchResults.response = {
                  ...searchResults.response,
                  search_id: data.data.search_id,
                  conversation_id: data.data.conversation_id || null,
                };
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'queries_generated':
                console.log('Received queries generated data:', data.data);
                searchResults.response = {
                  ...searchResults.response,
                  queries: data.data.queries,
                  query_generation_duration: data.data.duration
                };
                // Call the update callback with current state
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'results':
                console.log('Received results data, size:', jsonStr.length);
                console.log(`Results contain ${data.data.results.length} documents and ${data.data.results_authors.length} authors`, data.data.results_authors);
                searchResults.response = {
                  ...searchResults.response,
                  results: data.data.results,
                  results_authors: data.data.results_authors || [],  // All authors for document tags
                  relevant_authors: data.data.relevant_authors || [],  // Only relevant authors for people cards
                  duration: data.data.duration,
                  config: data.data.config || { generate_response: true, followup_flag: true }
                };
                // Call the update callback with current state
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'summary_chunk':

                // Replace the summary with the new chunk (which contains the full accumulated text)
                let previousSummary = ''
                if (searchResults.response.summary) {
                  previousSummary = searchResults.response.summary
                }
                let currentSummary = data.data.chunk;

                // Update the UI with the complete summary from this chunk
                searchResults.response = {
                  ...searchResults.response,
                  summary: previousSummary + currentSummary
                };
                if (onResultsUpdate) onResultsUpdate({ ...searchResults });
                break;

              case 'metadata_update':
                console.log('Received metadata update:', data.data);
                // Store metadata updates but don't trigger UI updates yet
                // We'll only show these when the summary is complete
                if (data.data.relevant_file_names) {
                  searchResults.response.relevant_file_names = data.data.relevant_file_names;
                }
                if (data.data.followup_questions) {
                  searchResults.response.followup_questions = data.data.followup_questions;
                }
                if (data.data.relevant_authors) {
                  searchResults.response.relevant_authors = data.data.relevant_authors;
                }
                // Don't call onResultsUpdate here - wait for summary_complete
                break;

              case 'summary_complete':

                // Use the final parsed summary which should be clean and complete
                searchResults.response = {
                  ...searchResults.response,
                  summary: data.data.summary,
                  relevant_file_names: data.data.relevant_file_names,
                  followup_questions: data.data.followup_questions,
                  formatted_documents: data.data.formatted_documents,
                  relevant_authors: data.data.relevant_authors || []
                };
                console.log('Summary complete - received relevant_authors:', data.data.relevant_authors?.length || 0);
                // Now trigger UI update with all accumulated metadata
                if (onResultsUpdate) onResultsUpdate({ ...searchResults });
                break;

              case 'summary':
                // Handle legacy summary type for backward compatibility
                console.log('Received legacy summary data, size:', jsonStr.length);
                searchResults.response = {
                  ...searchResults.response,
                  summary: data.data.summary,
                  relevant_file_names: data.data.relevant_file_names,
                  followup_questions: data.data.followup_questions,
                  formatted_documents: data.data.formatted_documents,
                  relevant_authors: data.data.relevant_authors || []
                };
                // Call the update callback with current state
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'search_complete':
                // Search completed without AI response
                searchResults.response = {
                  ...searchResults.response,
                  results_authors: data.data.results_authors || [],
                  relevant_authors: data.data.relevant_authors || [],
                  search_complete: true
                };
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'followup_search_complete':
                // Followup search completed without AI response
                searchResults.response = {
                  ...searchResults.response,
                  followup_search_complete: true
                };
                if (onResultsUpdate) onResultsUpdate(searchResults);
                break;

              case 'error':
                throw new Error(data.data.error);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
            console.error('Line number:', lineCount);
            console.error('Line length:', line.length);
            console.error('First 100 chars of problematic line:', line.substring(0, 100));
            console.error('Last 100 chars of problematic line:', line.substring(line.length - 100));

            // Try to find the position of the error
            if (e instanceof SyntaxError && e.message.includes('position')) {
              const position = parseInt(e.message.match(/position (\d+)/)[1]);
              console.error('Error position:', position);
              console.error('Context around error:', jsonStr.substring(Math.max(0, position - 50), position + 50));
            }
          }
        }
      }
    }

    return searchResults;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      throw error;
    }
    console.error('Search error:', error);
    throw error;
  }
}

// Function to perform search with GET method (for URL-based searches) - now just a wrapper
async function performSearchByURL(query, signal = null, onResultsUpdate = null) {
  return performSearch(query, {
    method: 'GET',
    signal,
    onResultsUpdate
  });
}

/**
 * Replay a previous search using smart queries and searchId.
 * @param {Object} options - { smart_queries, search_id, signal, onResultsUpdate }
 * @returns {Promise<Object>} - The search results object.
 */
async function replaySearch({
  original_query,
  last_question,
  conversation_history,
  smart_queries,
  search_id,
  final_followup_questions = [],
  conversation_id = null,
  generate_response = true,
  streaming = true,
  signal = null,
  onResultsUpdate = null
}) {

  try {
    const payload = {
      original_query,
      last_question,
      conversation_history,
      smart_queries,
      search_id,
      final_followup_questions,
      conversation_id,
      generate_response,
      streaming
    };

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(payload)
    };

    const response = await fetch(`${API_BASE_URL}/replay_search`, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Streaming response handling (similar to performSearch)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let replayResults = { response: {} };
    let lineCount = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        lineCount++;
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            const data = JSON.parse(jsonStr);

            switch (data.type) {
              case 'replay_results':
                replayResults.response = {
                  ...replayResults.response,
                  results: data.data.results,
                  results_authors: data.data.results_authors || [],  // All authors for document tags
                  relevant_authors: data.data.relevant_authors || [],  // Only relevant authors for people cards
                  duration: data.data.duration,
                  search_id: data.data.search_id,  // Include search_id from replay results
                  config: data.data.config || {}
                };
                if (onResultsUpdate) onResultsUpdate(replayResults);
                break;
              case 'summary_chunk':
                let previousSummary = replayResults.response.summary || '';
                let currentSummary = data.data.chunk;
                replayResults.response = {
                  ...replayResults.response,
                  summary: previousSummary + currentSummary
                };
                if (onResultsUpdate) onResultsUpdate({ ...replayResults });
                break;
              case 'metadata_update':
                if (data.data.relevant_file_names) {
                  replayResults.response.relevant_file_names = data.data.relevant_file_names;
                }
                if (data.data.followup_questions) {
                  replayResults.response.followup_questions = data.data.followup_questions;
                }
                if (data.data.relevant_authors) {
                  replayResults.response.relevant_authors = data.data.relevant_authors;
                }
                break;
              case 'summary_complete':
                replayResults.response = {
                  ...replayResults.response,
                  summary: data.data.summary,
                  relevant_file_names: data.data.relevant_file_names,
                  followup_questions: data.data.followup_questions,
                  formatted_documents: data.data.formatted_documents,
                  relevant_authors: data.data.relevant_authors || []
                };
                if (onResultsUpdate) onResultsUpdate({ ...replayResults });
                break;
              case 'replay_search_complete':
                // Followup search completed without AI response
                replayResults.response = {
                  ...replayResults.response,
                  replay_search_complete: true
                };
                if (onResultsUpdate) onResultsUpdate({ ...replayResults });
                break;
              case 'error':
                throw new Error(data.data.error);
            }
          } catch (e) {
            console.error('Error parsing replay_search SSE data:', e);
          }
        }
      }
    }

    return replayResults;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Replay search request was aborted');
      throw error;
    }
    console.error('Replay search error:', error);
    throw error;
  }
}

// Function to send conversation message
async function sendConversationMessage(message, conversationData, onResultsUpdate = null) {
  const {
    searchId, // To update and save conversation context
    conversationId, // For logging chat history, if needed
    originalQuery,
    formattedDocuments,
    summary,
    chatHistory,
    relevantFileNames,
    generate_response = true
  } = conversationData;

  if (TESTING_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return dummy response
    return `Based on the search results and your question "${message}", here's what I found: The documents contain comprehensive information about various aspects of the business. The Q4 Financial Report shows strong performance with 15% revenue growth, while the Product Development Roadmap outlines upcoming features including AI-powered search capabilities. The Customer Feedback Analysis indicates high satisfaction with core features but identifies areas for improvement in user onboarding.`;
  }

  try {
    // Keep chat history as an array of {role, content} objects (preserve structure expected by backend)
    const chatHistoryPayload = Array.isArray(chatHistory) ? chatHistory : [];
    console.log('Sending conversation message with search ID:', searchId, 'and conversation ID:', conversationId);
    const payload = {
      search_id: searchId, // Include search ID if available, to save conversation context
      conversation_id: conversationId, // Use a consistent conversation ID format
      original_query: originalQuery,
      followup_question: message,
      conversation_history: chatHistoryPayload,
      // Include formatted documents so backend can summarise the JSON you provide
      formatted_documents: formattedDocuments,
      streaming: true,
      generate_response: generate_response
    };
    console.log('Follow-up payload:', payload);

    const response = await fetch(`${API_BASE_URL}/followup_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to get follow-up search response');
    }

    // Handle SSE response similar to performSearch
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lineCount = 0;

    // Initialize follow-up search results structure
    const followupSearchResults = {
      response: {
        results: [],
        summary: '',
        relevant_file_names: [],
        followup_questions: [],
        formatted_documents: '',
        duration: 0
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        lineCount++;
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue; // Skip empty lines

            const data = JSON.parse(jsonStr);

            if (data.type === 'small_talk') {
              // Handle small talk response
              return data.data.message;
            }

            switch (data.type) {
              case 'queries_generated':
                console.log('Received follow-up queries generated data:', data.data);
                followupSearchResults.response = {
                  ...followupSearchResults.response,
                  queries: data.data.queries,
                  query_generation_duration: data.data.duration
                };
                // Call the update callback with current state
                if (onResultsUpdate) onResultsUpdate(followupSearchResults);
                break;

              case 'followup_results':
                console.log('Received follow-up results data');
                followupSearchResults.response = {
                  ...followupSearchResults.response,
                  results: data.data.results,
                  results_authors: data.data.results_authors || [],  // All authors for document tags
                  relevant_authors: data.data.relevant_authors || [],  // Only relevant authors for people cards
                  duration: data.data.duration,
                  config: data.data.config || { generate_response: true, followup_flag: true }
                };
                // Call the update callback with current state
                if (onResultsUpdate) onResultsUpdate(followupSearchResults);
                break;

              case 'summary_chunk':
                // Accumulate summary chunks
                let previousSummary = followupSearchResults.response.summary || '';
                let currentSummary = data.data.chunk;

                followupSearchResults.response = {
                  ...followupSearchResults.response,
                  summary: previousSummary + currentSummary
                };
                if (onResultsUpdate) onResultsUpdate({ ...followupSearchResults });
                break;

              case 'metadata_update':
                console.log('Received follow-up metadata update:', data.data);
                // Store metadata updates but don't trigger UI updates yet
                // We'll only show these when the summary is complete
                if (data.data.relevant_file_names) {
                  followupSearchResults.response.relevant_file_names = data.data.relevant_file_names;
                }
                if (data.data.followup_questions) {
                  followupSearchResults.response.followup_questions = data.data.followup_questions;
                }
                if (data.data.relevant_authors) {
                  followupSearchResults.response.relevant_authors = data.data.relevant_authors;
                }
                // Don't call onResultsUpdate here - wait for summary_complete
                break;

              case 'summary_complete':
                // Use the final parsed summary
                followupSearchResults.response = {
                  ...followupSearchResults.response,
                  summary: data.data.summary,
                  relevant_file_names: data.data.relevant_file_names,
                  followup_questions: data.data.followup_questions,
                  relevant_authors: data.data.relevant_authors || [],
                  formatted_documents: data.data.formatted_documents
                };
                // Now trigger UI update with all accumulated metadata
                if (onResultsUpdate) onResultsUpdate({ ...followupSearchResults });
                break;

              case 'followup_search_complete':
                // Followup search completed without AI response
                followupSearchResults.response = {
                  ...followupSearchResults.response,
                  followup_search_complete: true
                };
                if (onResultsUpdate) onResultsUpdate(followupSearchResults);
                break;

              case 'error':
                throw new Error(data.data.error);
            }
          } catch (e) {
            console.error('Error parsing follow-up SSE data:', e);
            console.error('Line number:', lineCount);
            console.error('Line content:', line);
          }
        }
      }
    }

    // Return the final summary for backward compatibility
    return followupSearchResults.response.summary;

  } catch (error) {
    console.error('Follow-up search error:', error);
    throw error;
  }
}

// Function to handle sending conversation message with state management
async function handleSendConversationMessage(
  message,
  conversationData,
  stateCallbacks
) {
  const {
    searchId, // To update and save conversation context
    conversationId, // For logging chat history, if needed
    originalQuery,
    formattedDocuments,
    summary,
    chatHistory,
    relevantFileNames,
    generate_response
  } = conversationData;

  const updateResultsFn = (updatedResults) => {
    // Use the unified handler for follow-up conversations
    if (handleResultsUpdate) {
      handleResultsUpdate(updatedResults, {
        isFollowupConversation: true,
        setChatHistory,
        resultsCleared
      });
    }
  };

  const {
    setIsLoadingConversation,
    setIsLoadingFollowupSearch,
    setIsLoadingSummary,
    setConversationError,
    setConversationInput,
    setChatHistory,
    setSearchResults,
    setConversationStarted,
    setShowConversationInput,
    setCurrentQueries,
    handleResultsUpdate
  } = stateCallbacks;

  setIsLoadingConversation(true);
  setIsLoadingFollowupSearch(true);
  setIsLoadingSummary(true);
  setConversationError(null);

  // Clear currentQueries when starting a new follow-up conversation
  setCurrentQueries(null);

  // Clear the input field immediately
  setConversationInput('');

  // Track if we've cleared the results yet
  let resultsCleared = false;

  // Get current chat history before adding the new message
  let currentChatHistory = [...chatHistory];

  // Always include the original query and summary as context if they exist and aren't already in history
  if (originalQuery && summary) {
    // Check if the original query is already in the history
    const hasOriginalQuery = currentChatHistory.some(msg =>
      msg.role === 'user' && msg.content === originalQuery
    );

    // Check if the original summary is already in the history (be more flexible)
    const hasOriginalSummary = currentChatHistory.some(msg =>
      msg.role === 'assistant' && (
        msg.content === summary ||
        msg.content.includes(summary.substring(0, 100)) || // Check if content contains first 100 chars of summary
        summary.includes(msg.content.substring(0, 100))    // Check if summary contains first 100 chars of content
      )
    );

    // Add original query and summary if they're not already present
    if (!hasOriginalQuery) {
      currentChatHistory.unshift({ role: 'user', content: originalQuery });
    }
    if (!hasOriginalSummary) {
      currentChatHistory.splice(hasOriginalQuery ? 1 : 1, 0, { role: 'assistant', content: summary });
    }

    // Additional safety check: if we still don't have the original summary after the above logic,
    // force add it at the beginning (after the original query)
    const hasAnyOriginalSummary = currentChatHistory.some(msg =>
      msg.role === 'assistant' && msg.content === summary
    );

    if (!hasAnyOriginalSummary) {
      // Find the position after the original query
      const originalQueryIndex = currentChatHistory.findIndex(msg =>
        msg.role === 'user' && msg.content === originalQuery
      );

      if (originalQueryIndex !== -1) {
        currentChatHistory.splice(originalQueryIndex + 1, 0, { role: 'assistant', content: summary });
      }
    }
  }

  // Final safety check: ensure the original summary is always the first assistant message
  if (originalQuery && summary) {
    const originalQueryIndex = currentChatHistory.findIndex(msg =>
      msg.role === 'user' && msg.content === originalQuery
    );

    if (originalQueryIndex !== -1) {
      // Check if there's an assistant message right after the original query
      const nextMessage = currentChatHistory[originalQueryIndex + 1];
      if (!nextMessage || nextMessage.role !== 'assistant' || nextMessage.content !== summary) {
        // Remove any existing assistant message that might be in the wrong position
        currentChatHistory = currentChatHistory.filter((msg, index) =>
          !(msg.role === 'assistant' && msg.content === summary && index !== originalQueryIndex + 1)
        );

        // Insert the original summary right after the original query
        currentChatHistory.splice(originalQueryIndex + 1, 0, { role: 'assistant', content: summary });
      }
    }
  }

  // Immediately add user message to chat history for UI
  setChatHistory(prev => [...prev, { role: 'user', content: message }]);

  // Add an empty assistant message that will be updated as the response streams in
  setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

  try {
    // Call the new follow-up search function with results update callback
    const response = await sendConversationMessage(message, {
      searchId, // Include search ID to save conversation context
      conversationId, // Include conversation ID for logging
      originalQuery,
      formattedDocuments,
      summary,
      chatHistory: currentChatHistory, // Use current history, not updated one
      relevantFileNames,
      generate_response
    },
      // (updatedResults) => {
      //   // Use the unified handler for follow-up conversations
      //   if (handleResultsUpdate) {
      //     handleResultsUpdate(updatedResults, {
      //       isFollowupConversation: true,
      //       setChatHistory,
      //       resultsCleared
      //     });
      //   }
      // }
      updateResultsFn
    );

    setIsLoadingConversation(false);
    setIsLoadingFollowupSearch(false);
    setIsLoadingSummary(false);
    setConversationStarted(true);
    // Hide conversation input after successful follow-up
    setShowConversationInput(false);

    return response;

  } catch (err) {
    setConversationError(err.message);
    setIsLoadingConversation(false);
    setIsLoadingFollowupSearch(false);
    setIsLoadingSummary(false);

    // Remove the empty assistant message if there was an error
    setChatHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant' && newHistory[newHistory.length - 1].content === '') {
        newHistory.pop();
      }
      return newHistory;
    });

    throw err;
  }
}

// Function to get recent and popular search suggestions
async function getRecentAndPopularSuggestions() {
  try {
    if (TESTING_MODE) {
      // Import dummy data for testing
      const { dummySuggestions } = await import('./data/dummySearchResponse');
      return {
        recent_searches: [
          { query: 'test search 1' },
          { query: 'test search 2' }
        ],
        popular_searches: [
          { query: 'popular search 1' },
          { query: 'popular search 2' }
        ],
        autofill: []
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/suggestions/${DEFAULT_USER}`);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent and popular suggestions:', error);
    return {
      recent_searches: [],
      popular_searches: [],
      autofill: []
    };
  }
}

// Function to get autofill suggestions
async function getAutofillSuggestions(query) {
  try {
    if (TESTING_MODE) {
      // Import dummy data for testing
      const { dummySuggestions } = await import('./data/dummySearchResponse');
      const filteredSuggestions = dummySuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      return filteredSuggestions;
    }

    const response = await fetch(`${API_BASE_URL}/api/suggestions/autofill?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error fetching autofill suggestions:', error);
    return [];
  }
}

// Function to send feedback (like/dislike)
async function sendFeedback(searchId, interactionType, followupIndex = 0) {
  try {
    if (TESTING_MODE) {
      console.log(`[TESTING] Feedback sent: ${interactionType} for search ${searchId}, followup ${followupIndex}`);
      return { success: true, action: 'created' };
    }

    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_id: searchId,
        interaction_type: interactionType,
        followup_index: followupIndex
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending feedback:', error);
    throw error;
  }
}

// Function to track document clicks
async function trackDocumentClick(searchId, documentId, documentName, documentPosition, followupIndex = 0) {
  try {
    if (TESTING_MODE) {
      console.log(`[TESTING] Document click tracked: ${documentName} (pos: ${documentPosition}) for search ${searchId}, followup ${followupIndex}`);
      return { success: true };
    }

    const response = await fetch(`${API_BASE_URL}/document_click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_id: searchId,
        document_id: documentId,
        document_name: documentName,
        document_position: documentPosition,
        followup_index: followupIndex
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error tracking document click:', error);
    throw error;
  }
}

// Function to get user interactions for a specific search and followup index
async function getUserInteractions(searchId, followupIndex = 0) {
  try {
    if (TESTING_MODE) {
      console.log(`[TESTING] Getting interactions for search ${searchId}, followup ${followupIndex}`);
      return { liked: false, disliked: false, document_clicks: [] };
    }

    const response = await fetch(`${API_BASE_URL}/user_interactions?search_id=${searchId}&followup_index=${followupIndex}`);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user interactions:', error);
    return { liked: false, disliked: false, document_clicks: [] };
  }
}

export {
  // createResource, 
  getSearchSuggestions,
  getSearchHistory,
  searchUserHistory,
  performSearch,
  performSearchByURL,
  sendConversationMessage,
  handleSendConversationMessage,
  getRecentAndPopularSuggestions,
  getAutofillSuggestions,
  sendFeedback,
  trackDocumentClick,
  getUserInteractions,
  TESTING_MODE,
  replaySearch // when loading chatHistory
};