import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Leaf,
  Thermometer,
  Droplets,
  RefreshCw,
  Clock,
  FileText,
  Shield,
  FlaskConical,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { 
  simulateCameraScan, 
  getScanHistory,
  startAutoScan
} from '../services/mockIoTService';
import { getAIDiseaseAnalysis } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';
import { useFarm } from '../context/FarmContext';

const DiseaseDetection = () => {
  const [currentScan, setCurrentScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [treatmentType, setTreatmentType] = useState('organic');
  const [trackingData, setTrackingData] = useState([]);

  const { t, language } = useLanguage();
  const { reportDisease, updateDiseaseProgress, currentCrop } = useFarm();
  const cropName = currentCrop || 'Tomato';

  useEffect(() => {
    // Start auto-scanning
    const stopAutoScan = startAutoScan(async (result) => {
      setCurrentScan(result);
      setScanHistory(getScanHistory());
      setLoading(false);
      
      // Get AI analysis for diseases
      if (result.diseaseKey !== 'healthy') {
        setLoadingAI(true);
        const analysis = await getAIDiseaseAnalysis(result.disease, cropName, 0.8);
        setAiAnalysis(analysis);
        setLoadingAI(false);
        
        // Report disease to global context for dashboard
        reportDisease({
          name: result.disease.name,
          stage: analysis?.diagnosis?.stage || 'Detected',
          confidence: result.confidence,
          spreadRisk: analysis?.diagnosis?.spreadRisk || 'Medium',
          nextAction: analysis?.immediateActions?.[0] || 'Apply treatment',
          treatmentPlan: analysis?.treatmentPlan,
          monitoringSchedule: analysis?.monitoringSchedule
        });
        
        // Add to local tracking
        setTrackingData(prev => [{
          id: Date.now(),
          date: new Date(),
          disease: result.disease.name,
          stage: analysis?.diagnosis?.stage || 'Detected',
          action: 'Initial detection',
          status: 'active'
        }, ...prev].slice(0, 10));
      } else {
        setAiAnalysis(null);
      }
    }, 60000);

    return stopAutoScan;
  }, [cropName]);

  const handleManualScan = async () => {
    setLoading(true);
    setAiAnalysis(null);
    
    setTimeout(async () => {
      const result = simulateCameraScan();
      setCurrentScan(result);
      setScanHistory(getScanHistory());
      setLoading(false);
      
      if (result.diseaseKey !== 'healthy') {
        setLoadingAI(true);
        const analysis = await getAIDiseaseAnalysis(result.disease, cropName, 0.8, language);
        setAiAnalysis(analysis);
        setLoadingAI(false);
      }
    }, 1500);
  };

  const markActionComplete = (dayIndex) => {
    if (aiAnalysis?.monitoringSchedule) {
      const updated = { ...aiAnalysis };
      updated.monitoringSchedule[dayIndex].completed = true;
      setAiAnalysis(updated);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': case 'Advanced': return 'var(--color-error)';
      case 'Medium': case 'Moderate': return 'var(--color-warning)';
      case 'Low': case 'Early': return 'var(--color-info)';
      default: return 'var(--color-success)';
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !currentScan) {
    return (
      <div className="disease-page">
        <div className="loading-state">
          <Camera className="pulse" size={48} />
          <p>{t('scanning') || 'Scanning...'}</p>
        </div>
      </div>
    );
  }

  const isHealthy = currentScan?.diseaseKey === 'healthy';
  const disease = currentScan?.disease;

  return (
    <div className="disease-page">
      {/* Header */}
      <div className="disease-header">
        <div>
          <h1>{t('disease_title')}</h1>
          <p className="disease-subtitle">{t('disease_subtitle')}</p>
        </div>
        <button className="btn btn-primary scan-btn" onClick={handleManualScan} disabled={loading}>
          {loading ? <RefreshCw className="spin" size={18} /> : <Camera size={18} />}
          {loading ? t('scanning') : t('manual_scan')}
        </button>
      </div>

      {/* Scan Result Card */}
      <div className={`scan-result-card card ${isHealthy ? 'healthy' : 'infected'}`}>
        <div className="scan-result-header">
          <div className={`scan-status ${isHealthy ? 'status-healthy' : 'status-infected'}`}>
            {isHealthy ? (
              <CheckCircle size={40} color="var(--color-success)" />
            ) : (
              <AlertTriangle size={40} color="var(--color-error)" />
            )}
            <div>
              <h2>{disease?.name}</h2>
              <p className="scan-time">
                <Clock size={14} /> {t('scan_result')}: {formatTime(currentScan?.timestamp)}
              </p>
            </div>
          </div>
          <div className="confidence-badge">
            <span className="confidence-value">{currentScan?.confidence}%</span>
            <span className="confidence-label">{t('confidence')}</span>
          </div>
        </div>

        {/* Sensor Data - Simplified without NPK */}
        <div className="sensor-grid simple">
          <div className="sensor-item">
            <Leaf size={20} color="var(--color-primary)" />
            <div>
              <span className="sensor-value">{currentScan?.sensorData?.leafHealthIndex}%</span>
              <span className="sensor-label">{t('leaf_health')}</span>
            </div>
          </div>
          <div className="sensor-item">
            <Droplets size={20} color="var(--color-accent)" />
            <div>
              <span className="sensor-value">{currentScan?.sensorData?.moistureLevel}%</span>
              <span className="sensor-label">{t('soil_moisture')}</span>
            </div>
          </div>
          <div className="sensor-item">
            <Thermometer size={20} color="var(--color-warning)" />
            <div>
              <span className="sensor-value">{currentScan?.sensorData?.temperature}°C</span>
              <span className="sensor-label">{t('temperature')}</span>
            </div>
          </div>
        </div>

        {!isHealthy && aiAnalysis?.diagnosis && (
          <div className="ai-diagnosis">
            <h4>🤖 {t('ai_analysis')}</h4>
            <div className="diagnosis-grid">
              <div className="diagnosis-item">
                <span>Stage:</span>
                <span className="diagnosis-badge" style={{ backgroundColor: getSeverityColor(aiAnalysis.diagnosis.stage) }}>
                  {aiAnalysis.diagnosis.stage}
                </span>
              </div>
              <div className="diagnosis-item">
                <span>Spread Risk:</span>
                <span>{aiAnalysis.diagnosis.spreadRisk}</span>
              </div>
              <div className="diagnosis-item">
                <span>Recovery:</span>
                <span>{aiAnalysis.recoveryTimeline}</span>
              </div>
              <div className="diagnosis-item">
                <span>Success Rate:</span>
                <span>{aiAnalysis.successRate}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Loading State */}
      {loadingAI && (
        <div className="ai-loading card">
          <RefreshCw className="spin" size={24} />
          <p>{t('analyzing')}</p>
        </div>
      )}

      {/* Immediate Actions */}
      {!isHealthy && aiAnalysis?.immediateActions && (
        <div className="immediate-actions card">
          <h3 className="card-title"><AlertTriangle size={20} color="var(--color-error)" /> {t('immediate_actions')}</h3>
          <ul className="action-list">
            {aiAnalysis.immediateActions.map((action, index) => (
              <li key={index} className="action-item urgent">
                <span className="action-number">{index + 1}</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Treatment Plan */}
      {!isHealthy && aiAnalysis?.treatmentPlan && (
        <div className="treatment-section">
          <div className="treatment-header">
            <h2 className="section-title">🤖 {t('treatment_plan')}</h2>
            <div className="treatment-toggle">
              <button 
                className={`toggle-btn ${treatmentType === 'organic' ? 'active' : ''}`}
                onClick={() => setTreatmentType('organic')}
              >
                <Leaf size={16} /> {t('organic')}
              </button>
              <button 
                className={`toggle-btn ${treatmentType === 'chemical' ? 'active' : ''}`}
                onClick={() => setTreatmentType('chemical')}
              >
                <FlaskConical size={16} /> {t('chemical')}
              </button>
            </div>
          </div>

          <div className="treatment-cards">
            {aiAnalysis.treatmentPlan[treatmentType]?.map((treatment, index) => (
              <div key={index} className="card treatment-card">
                <h4>{treatment.name}</h4>
                <div className="treatment-details">
                  <div className="treatment-row">
                    <span>Dosage:</span>
                    <strong>{treatment.dosage}</strong>
                  </div>
                  <div className="treatment-row">
                    <span>Frequency:</span>
                    <strong>{treatment.frequency}</strong>
                  </div>
                  <div className="treatment-row">
                    <span>{t('price')}:</span>
                    <strong>₹{treatment.cost}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cost-estimate card">
            <div className="cost-header">
              <FileText size={20} />
              <h4>{t('estimated_cost')}</h4>
            </div>
            <div className="cost-value">₹{aiAnalysis.totalEstimatedCost}</div>
            <p className="cost-note">For complete treatment cycle</p>
          </div>
        </div>
      )}

      {/* Monitoring & Tracking Schedule */}
      {!isHealthy && aiAnalysis?.monitoringSchedule && (
        <div className="monitoring-section card">
          <h3 className="card-title"><Calendar size={20} /> {t('tracking_schedule')}</h3>
          <div className="monitoring-timeline">
            {aiAnalysis.monitoringSchedule.map((item, index) => (
              <div key={index} className={`monitoring-item ${item.completed ? 'completed' : ''}`}>
                <div className="monitoring-day">Day {item.day}</div>
                <div className="monitoring-action">{item.action}</div>
                <button 
                  className={`tracking-btn ${item.completed ? 'done' : ''}`}
                  onClick={() => markActionComplete(index)}
                  disabled={item.completed}
                >
                  {item.completed ? <CheckCircle size={16} /> : <Target size={16} />}
                  {item.completed ? 'Done' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevention Tips */}
      <div className="prevention-section card">
        <h3 className="card-title">
          <Shield size={20} /> {isHealthy ? t('prevention_tips') : 'Future Prevention'}
        </h3>
        <ul className="prevention-list">
          {(aiAnalysis?.prevention || disease?.preventionTips)?.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Disease Tracking History */}
      {trackingData.length > 0 && (
        <div className="tracking-history card">
          <h3 className="card-title"><TrendingUp size={20} /> Disease Tracking History</h3>
          <div className="tracking-list">
            {trackingData.map((track) => (
              <div key={track.id} className={`tracking-item status-${track.status}`}>
                <div className="track-date">
                  {new Date(track.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
                <div className="track-info">
                  <span className="track-disease">{track.disease}</span>
                  <span className="track-stage">{track.stage}</span>
                </div>
                <div className="track-action">{track.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 1 && (
        <div className="history-section">
          <h2 className="section-title">{t('recent_scans')}</h2>
          <div className="history-list">
            {scanHistory.slice(1, 5).map((scan) => (
              <div key={scan.id} className={`history-item ${scan.diseaseKey === 'healthy' ? 'healthy' : 'infected'}`}>
                <div className="history-icon">
                  {scan.diseaseKey === 'healthy' ? (
                    <CheckCircle size={16} color="var(--color-success)" />
                  ) : (
                    <AlertTriangle size={16} color="var(--color-error)" />
                  )}
                </div>
                <div className="history-content">
                  <span className="history-name">{scan.disease?.name}</span>
                  <span className="history-time">{formatTime(scan.timestamp)}</span>
                </div>
                <span className="history-confidence">{scan.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
