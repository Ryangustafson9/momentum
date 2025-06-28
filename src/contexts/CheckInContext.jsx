import React, { createContext, useContext, useState, useCallback } from 'react';

const CheckInContext = createContext();

export const useCheckIn = () => {
  const context = useContext(CheckInContext);
  if (!context) {
    throw new Error('useCheckIn must be used within a CheckInProvider');
  }
  return context;
};

export const CheckInProvider = ({ children }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState(null);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const recordCheckIn = useCallback((checkInData) => {
    setLastCheckIn(checkInData);
  }, []);

  const value = {
    isScanning,
    lastCheckIn,
    startScanning,
    stopScanning,
    recordCheckIn
  };

  return (
    <CheckInContext.Provider value={value}>
      {children}
    </CheckInContext.Provider>
  );
};

export default CheckInContext;
