import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

const API_URL = 'http://localhost:5001/api';

export const FarmProvider = ({ children }) => {
  const { user, getToken, updateUser, isAuthenticated } = useAuth();
  const [farmProfile, setFarmProfile] = useState({
    farmName: 'My Farm',
    farmSize: 1,
    location: { lat: null, lng: null, city: '' },
    soilType: 'alluvial',
    waterAvailability: 'moderate',
    currentCrop: '',
    sowingDate: null,
    isNotDecided: true
  });
  const [loading, setLoading] = useState(false);
  
  // Disease tracking state
  const [activeDisease, setActiveDisease] = useState(null);
  const [diseaseHistory, setDiseaseHistory] = useState([]);

  // Sync farm profile from user data
  useEffect(() => {
    if (user?.farmProfile) {
      setFarmProfile(user.farmProfile);
    }
  }, [user]);

  const updateFarmProfile = async (profileData) => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (token) {
        const response = await axios.put(`${API_URL}/farm/profile`, profileData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFarmProfile(response.data.farmProfile);
        // Update the user object with new farm data
        if (updateUser && user) {
          updateUser({
            ...user,
            farmProfile: response.data.farmProfile,
            isProfileComplete: response.data.isProfileComplete
          });
        }
        return { success: true };
      } else {
        // For non-authenticated users, just update local state
        setFarmProfile(profileData);
        return { success: true };
      }
    } catch (err) {
      console.error('Update farm profile error:', err);
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Calculate days since sowing
  const getDaysSinceSowing = () => {
    if (farmProfile.isNotDecided || !farmProfile.sowingDate) {
      return 30; // Default value
    }
    const sowing = new Date(farmProfile.sowingDate);
    const today = new Date();
    const diffTime = Math.abs(today - sowing);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Disease tracking methods
  const reportDisease = (diseaseData) => {
    const newDisease = {
      id: Date.now(),
      ...diseaseData,
      detectedAt: new Date(),
      status: 'active',
      treatmentProgress: 0
    };
    setActiveDisease(newDisease);
    setDiseaseHistory(prev => [newDisease, ...prev].slice(0, 20));
  };

  const updateDiseaseProgress = (progress) => {
    if (activeDisease) {
      const updated = { ...activeDisease, treatmentProgress: progress };
      if (progress >= 100) {
        updated.status = 'resolved';
        updated.resolvedAt = new Date();
        setActiveDisease(null);
      } else {
        setActiveDisease(updated);
      }
      setDiseaseHistory(prev => 
        prev.map(d => d.id === updated.id ? updated : d)
      );
    }
  };

  const clearActiveDisease = () => {
    if (activeDisease) {
      setDiseaseHistory(prev => 
        prev.map(d => d.id === activeDisease.id ? { ...d, status: 'resolved', resolvedAt: new Date() } : d)
      );
      setActiveDisease(null);
    }
  };

  return (
    <FarmContext.Provider value={{
      farmProfile,
      loading,
      updateFarmProfile,
      getDaysSinceSowing,
      // Convenience getters for auto-fill
      farmSize: farmProfile.farmSize,
      soilType: farmProfile.soilType,
      waterAvailability: farmProfile.waterAvailability,
      currentCrop: farmProfile.currentCrop,
      sowingDate: farmProfile.sowingDate,
      isNotDecided: farmProfile.isNotDecided,
      // Disease tracking
      activeDisease,
      diseaseHistory,
      reportDisease,
      updateDiseaseProgress,
      clearActiveDisease
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
