// Mock IoT Service for simulating camera and sensor data

const DISEASES = {
  "rice-blast": {
    name: "Rice Blast",
    confidence: 92,
    severity: "Severe",
    symptoms: [
      "White to gray-green lesions",
      "Diamond shaped spots",
      "Dried leaves",
    ],
    preventionTips: [
      "Use resistant varieties",
      "Avoid excess nitrogen fertilization",
      "Maintain proper field drainage",
      "Apply preventive fungicides before disease onset",
    ],
    treatment: {
      organic: {
        name: "Bordeaux Mixture (1%)",
        dosage: "2 liters per spray",
        frequency: "Every 7 days",
        cost: 450,
      },
      chemical: {
        name: "Mancozeb Fungicide",
        dosage: "2.5g / liter of water",
        frequency: "Every 10 days",
        cost: 600,
      },
    },
  },
  "early-blight": {
    name: "Early Blight",
    confidence: 88,
    severity: "Moderate",
    symptoms: ["Concentric rings on leaves", "Yellowing", "Leaf drop"],
    preventionTips: [
      "Rotate crops with non-solanaceous crops",
      "Remove infected plant debris",
      "Ensure adequate plant spacing for air circulation",
      "Water at the base of plants, not on leaves",
    ],
    treatment: {
      organic: {
        name: "Neem Oil Solution",
        dosage: "5ml / liter",
        frequency: "Every 5 days",
        cost: 300,
      },
      chemical: {
        name: "Chlorothalonil",
        dosage: "2g / liter",
        frequency: "Every 7 days",
        cost: 550,
      },
    },
  },
  "late-blight": {
    name: "Late Blight",
    confidence: 90,
    severity: "Severe",
    symptoms: [
      "Dark water-soaked spots",
      "White mold on underside",
      "Rapid wilting",
    ],
    preventionTips: [
      "Use certified disease-free seeds",
      "Avoid overhead irrigation",
      "Remove and destroy infected plants",
      "Apply fungicides preventively in humid weather",
    ],
    treatment: {
      organic: {
        name: "Copper Fungicide",
        dosage: "3g / liter",
        frequency: "Every 5 days",
        cost: 400,
      },
      chemical: {
        name: "Metalaxyl",
        dosage: "2g / liter",
        frequency: "Every 7 days",
        cost: 700,
      },
    },
  },
  healthy: {
    name: "Healthy Crop",
    confidence: 98,
    severity: "None",
    symptoms: [],
    preventionTips: [
      "Continue regular monitoring",
      "Maintain proper irrigation schedule",
      "Follow integrated pest management practices",
      "Keep farm equipment clean",
    ],
    treatment: null,
  },
};

let scanHistory = [];

export const simulateCameraScan = () => {
  // Randomly select a disease or healthy state (70% healthy, 30% disease)
  const rand = Math.random();
  let diseaseKey;

  if (rand < 0.7) {
    diseaseKey = "healthy";
  } else if (rand < 0.8) {
    diseaseKey = "rice-blast";
  } else if (rand < 0.9) {
    diseaseKey = "early-blight";
  } else {
    diseaseKey = "late-blight";
  }

  const disease = DISEASES[diseaseKey];
  const result = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    diseaseKey,
    disease,
    confidence: disease.confidence + Math.floor(Math.random() * 5 - 2), // ±2%
    sensorData: {
      leafHealthIndex:
        diseaseKey === "healthy"
          ? 85 + Math.floor(Math.random() * 10)
          : 40 + Math.floor(Math.random() * 30),
      moistureLevel: 40 + Math.floor(Math.random() * 20),
      temperature: 24 + Math.floor(Math.random() * 8),
    },
  };

  scanHistory.unshift(result);
  if (scanHistory.length > 20) scanHistory.pop();

  return result;
};

export const getScanHistory = () => {
  return scanHistory;
};

export const startAutoScan = (callback, interval = 60000) => {
  // Initial scan
  const result = simulateCameraScan();
  callback(result);

  // Set up interval for auto-scanning
  const intervalId = setInterval(() => {
    const newResult = simulateCameraScan();
    callback(newResult);
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

export const getSoilData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        moisture: 35 + Math.random() * 20,
        ph: 6.0 + Math.random() * 1.5,
        nitrogen: 180 + Math.random() * 60,
        phosphorus: 15 + Math.random() * 15,
        potassium: 180 + Math.random() * 70,
        temperature: 24 + Math.random() * 6,
        timestamp: new Date().toISOString(),
      });
    }, 500);
  });
};

export const getWaterUsageStats = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split("T")[0],
          usage: 800 + Math.random() * 400,
          rainfall: Math.random() > 0.7 ? Math.random() * 30 : 0,
        });
      }
      resolve({
        daily: data,
        monthlyTotal: data.reduce((sum, day) => sum + day.usage, 0),
        lastMonthTotal: 32000 + Math.random() * 5000,
      });
    }, 500);
  });
};

export const getIrrigationRecommendation = (
  soilMoisture,
  cropType = "Tomato"
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const optimal = cropType === "Rice" ? 60 : 45;
      const critical = 30;

      let status = "good";
      let waterNeeded = 0;
      let urgency = "low";

      if (soilMoisture < critical) {
        status = "critical";
        waterNeeded = (optimal - soilMoisture) * 8;
        urgency = "high";
      } else if (soilMoisture < optimal - 5) {
        status = "warning";
        waterNeeded = (optimal - soilMoisture) * 6;
        urgency = "medium";
      }

      resolve({
        status,
        urgency,
        currentMoisture: soilMoisture,
        optimalMoisture: optimal,
        waterNeeded: Math.round(waterNeeded),
        nextIrrigationIn: status === "good" ? "2-3 days" : "Immediate",
        cost: Math.round(waterNeeded * 0.5),
      });
    }, 300);
  });
};
