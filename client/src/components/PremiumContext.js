// src/context/PremiumContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useCookies } from "react-cookie";
import { authenticatedFetch } from '../api'; // Your custom fetch wrapper

export const PremiumContext = createContext();


export const PremiumProvider = ({ children }) => {
  const [cookies] = useCookies(["AuthToken"]);
  const token = cookies.AuthToken;

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [error, setError] = useState(null);

  // Checks the user's premium status from the server
  const checkStatus = useCallback(async () => {
    if (!token) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${process.env.REACT_APP_SERVERURL}/users/me`);
      if (!response.ok) throw new Error('Could not verify status');

      const data = await response.json();
      setIsPremium(!!data.is_premium);
    } catch (err) {
      // Don't show an error if the session simply expired
      if (!err.message.includes('Session expired')) {
        console.error("Premium status check failed:", err);
      }
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handles the premium upgrade process by redirecting to Stripe
  const upgradeToPremium = async () => {
    console.log("Upgrade button clicked! The upgradeToPremium function has started."); // <-- ADD THIS LINE

    if (!token) {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session.');
      }

      const { url } = await response.json();
      if (!url) throw new Error("Checkout URL not found in server response.");

      // Redirect to Stripe
      window.location.href = url;

    } catch (err) {
        console.error("An error occurred during the upgrade process:", err);
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  // The value provided to all consuming components
  const contextValue = {
    isPremium,
    isLoading,
    error,
    upgradeToPremium,
    refreshStatus: checkStatus,
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};