/* eslint-disable no-undef */
// src/context/PremiumContext.js
import React, { createContext, useState, useEffect } from "react";

export const PremiumContext = createContext({
  isPremium: false,
  setIsPremium: () => {}
});

export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);

  //If you later want to fetch the user's premium status from your server:
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_SERVERURL}/users/premium-status`, {
          headers: { Authorization: `Bearer ${cookie.AuthToken}` }
        });
        const { premium } = await res.json();
        setIsPremium(premium);
      } catch (err) {
        console.error("Could not fetch premium status", err);
      }
    };
    checkPremium();
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, setIsPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};
