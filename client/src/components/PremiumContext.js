// src/context/PremiumContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { authenticatedFetch } from '../api'; // Using our custom fetch wrapper

// Create the context
export const PremiumContext = createContext();

// Create the provider component
export const PremiumProvider = ({ children }) => {
  const [cookies] = useCookies(['AuthToken']);
  const authToken = cookies.AuthToken;

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to check the user's premium status from the server
  const checkStatus = useCallback(async () => {
    if (!authToken) {
      setIsPremium(false);
      return;
    }
    try {
      // --- THE FIX: Use authenticatedFetch here as well ---
      const response = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/me`);
      
      if (!response.ok) throw new Error('Could not verify status');
      
      const data = await response.json();
      setIsPremium(!!data.is_premium);
    } catch (err) {
      // The authenticatedFetch helper will handle the 401 redirect,
      // but we can still log other potential errors.
      if (err.message.indexOf('Session expired') === -1) {
        setIsPremium(false);
        console.error("Premium status check failed:", err);
      }
    }
  }, [authToken]);

  // Check status on initial load
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // The main function to handle the upgrade process
  const upgradeToPremium = async () => {
    if (!authToken) {
      setError("You must be logged in to upgrade.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/billing/checkout`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session.');
      }
      
      const { url } = await response.json();

      if (!url) {
        throw new Error("Checkout URL not found in server response.");
      }

      window.location.href = url;

    } catch (err) {
      if (err.message.indexOf('Session expired') === -1) {
        console.error("An error occurred during the upgrade process:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }
  };

  const value = {
    isPremium,
    isLoading,
    error,
    upgradeToPremium,
    refreshStatus: checkStatus,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};
