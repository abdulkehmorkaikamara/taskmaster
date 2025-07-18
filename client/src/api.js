// src/api.js

// This function acts as a wrapper around the native fetch API.
// It automatically adds the Authorization header and handles 401 errors.

export const authenticatedFetch = async (url, options = {}) => {
  // Get the token from cookies
  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = value;
    return acc;
  }, {});
  const token = cookies.AuthToken;

  // Prepare the headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the actual fetch request
  const response = await fetch(url, { ...options, headers });

  // --- THIS IS THE CRUCIAL PART ---
  // If the server responds with 401, the token is invalid or expired.
  // We automatically log the user out and redirect them to the login page.
  if (response.status === 401) {
    console.log("Authentication failed (401). Logging out.");
    // Clear cookies
    document.cookie = "AuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "Email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to login page
    window.location.href = '/login'; 
    // Throw an error to stop further execution
    throw new Error('Session expired. Please log in again.');
  }

  return response;
};
