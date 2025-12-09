import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Thermometer,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Gauge,
  Calendar,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { 
  getSoilData,
  getIrrigationData,
  analyzeSoilHealth
} from '../services/soilWaterService';
import { getAIIrrigationRecommendation } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';

const SoilWater = () => {
  const [soil, setSoil] = useState(null);
  const [irrigation, setIrrigation] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [aiIrrigation, setAiIrrigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [trackingLog, setTrackingLog] = useState([]);

  const { t, language } = useLanguage();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const soilData = getSoilData();
    const irrigationData = getIrrigationData();
    
    setSoil(soilData);
    setIrrigation(irrigationData);
    setAnalysis(analyzeSoilHealth(soilData));
    setLoading(false);
    
    // Get AI irrigation recommendation
    setLoadingAI(true);
    const aiRec = await getAIIrrigationRecommendation(soilData, { temperature: 28, humidity: 60 }, 'Tomato', language);
    setAiIrrigation(aiRec);
    setLoadingAI(false);
  };

  const logIrrigationAction = (action) => {
    setTrackingLog(prev => [{
      id: Date.now(),
      date: new Date(),
      action,
      moisture: soil?.moisture,
      status: 'completed'
    }, ...prev].slice(0, 15));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <Info size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="soil-page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soil-page">
      {/* Header */}
      <div className="soil-header">
        <div>
          <h1>{t('soil_title')}</h1>
          <p className="soil-subtitle">{t('soil_subtitle')}</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>
          <RefreshCw size={18} /> {t('refresh')}
        </button>
      </div>

      {/* Health Score Card */}
      <div className="health-score-card card">
        <div className="score-circle" style={{ 
          background: `conic-gradient(${
            analysis?.healthScore > 70 ? 'var(--color-success)' : 
            analysis?.healthScore > 40 ? 'var(--color-warning)' : 'var(--color-error)'
          } ${analysis?.healthScore * 3.6}deg, var(--color-border) 0deg)`
        }}>
          <div className="score-inner">
            <span className="score-value">{analysis?.healthScore}</span>
            <span className="score-label">{t('health_score')}</span>
          </div>
        </div>
        <div className="health-status">
          <h3>{t('soil_health')}: <span style={{ 
            color: analysis?.status === 'Good' ? 'var(--color-success)' : 
                   analysis?.status === 'Fair' ? 'var(--color-warning)' : 'var(--color-error)'
          }}>{analysis?.status}</span></h3>
          <p>{t('last_updated')}: {soil?.lastUpdated?.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Sensor Grid - Simplified */}
      <div className="sensor-cards-grid">
        <div className="card sensor-card-large">
          <div className="sensor-icon-wrapper moisture">
            <Droplets size={24} />
          </div>
          <div className="sensor-info">
            <span className="sensor-name">{t('soil_moisture')}</span>
            <span className="sensor-reading">{Math.round(soil?.moisture)}%</span>
            <div className="moisture-bar">
              <div 
                className="moisture-fill" 
                style={{ 
                  width: `${soil?.moisture}%`,
                  backgroundColor: soil?.moisture < 30 ? 'var(--color-error)' : 
                                   soil?.moisture < 50 ? 'var(--color-warning)' : 'var(--color-success)'
                }}
              ></div>
            </div>
            <span className="sensor-hint">{t('optimal')}: 40-60%</span>
          </div>
        </div>

        <div className="card sensor-card-large">
          <div className="sensor-icon-wrapper ph">
            <Gauge size={24} />
          </div>
          <div className="sensor-info">
            <span className="sensor-name">{t('ph')}</span>
            <span className="sensor-reading">{soil?.ph}</span>
            <span className="sensor-hint">{t('optimal')}: 6.0-7.0</span>
          </div>
        </div>

        <div className="card sensor-card-large">
          <div className="sensor-icon-wrapper temp">
            <Thermometer size={24} />
          </div>
          <div className="sensor-info">
            <span className="sensor-name">{t('temperature')}</span>
            <span className="sensor-reading">{soil?.temperature}°C</span>
            <span className="sensor-hint">{t('optimal')}: 20-30°C</span>
          </div>
        </div>
      </div>

      {/* AI Irrigation Recommendation */}
      {loadingAI ? (
        <div className="ai-loading card">
          <RefreshCw className="spin" size={24} />
          <p>{t('analyzing')}</p>
        </div>
      ) : aiIrrigation && (
        <div className="ai-irrigation-card card">
          <div className="ai-header">
            <h3>🤖 {t('ai_irrigation_rec')}</h3>
            <span className={`rec-badge rec-${aiIrrigation.recommendation?.toLowerCase().replace(' ', '-')}`}>
              {aiIrrigation.recommendation}
            </span>
          </div>
          
          <p className="ai-reason">{aiIrrigation.reason}</p>
          
          <div className="irrigation-details-grid">
            <div className="irr-detail">
              <Clock size={18} />
              <div>
                <span className="detail-value">{aiIrrigation.bestTime}</span>
                <span className="detail-label">{t('best_time')}</span>
              </div>
            </div>
            <div className="irr-detail">
              <Droplets size={18} />
              <div>
                <span className="detail-value">{aiIrrigation.waterAmount}</span>
                <span className="detail-label">{t('water_avail')}</span>
              </div>
            </div>
            {/* Duration and Method kept as is or can be generalized */}
          </div>
        </div>
      )}

      {/* Weekly Irrigation Schedule */}
      {aiIrrigation?.weeklySchedule && (
        <div className="schedule-section card">
          <h3 className="card-title"><Calendar size={20} /> {t('weekly_schedule')}</h3>
          <div className="week-schedule">
            {aiIrrigation.weeklySchedule.map((day, index) => (
              <div key={index} className={`day-schedule ${day.irrigate ? 'irrigate' : 'skip'}`}>
                <span className="day-name">{day.day}</span>
                {day.irrigate ? (
                  <>
                    <Droplets size={16} className="day-icon irrigate" />
                    <span className="day-time">{day.time}</span>
                    <span className="day-duration">{day.duration}</span>
                  </>
                ) : (
                  <>
                    <span className="day-icon skip">—</span>
                    <span className="day-reason">{day.reason}</span>
                  </>
                )}
                <button 
                  className="log-btn"
                  onClick={() => logIrrigationAction(`${day.day}: ${day.irrigate ? 'Irrigated' : 'Skipped'}`)}
                >
                  Log
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water Saving Tips */}
      {aiIrrigation?.waterSavingTips && (
        <div className="tips-section card">
          <h3 className="card-title">💧 {t('water_saving_tips')}</h3>
          <ul className="tips-list">
            {aiIrrigation.waterSavingTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alerts */}
      {aiIrrigation?.alerts?.length > 0 && (
        <div className="alerts-section card alert-card">
          <h3 className="card-title"><AlertTriangle size={20} /> {t('alerts')}</h3>
          {aiIrrigation.alerts.map((alert, index) => (
            <div key={index} className="alert-item alert-critical">
              <AlertTriangle size={16} />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Irrigation Tracking Log */}
      {trackingLog.length > 0 && (
        <div className="tracking-section card">
          <h3 className="card-title"><TrendingUp size={20} /> {t('irrigation_log')}</h3>
          <div className="tracking-log">
            {trackingLog.map((log) => (
              <div key={log.id} className="log-item">
                <span className="log-date">
                  {new Date(log.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                <span className="log-time">
                  {new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="log-action">{log.action}</span>
                <span className="log-moisture">{t('soil_moisture')}: {Math.round(log.moisture)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis?.issues?.length > 0 && (
        <div className="recommendations-section">
          <h2 className="section-title">{t('issues_recs')}</h2>
          <div className="rec-list">
            {analysis.issues.map((issue, index) => (
              <div key={index} className={`rec-item alert-${issue.type}`}>
                {getAlertIcon(issue.type)}
                <span>{issue.message}</span>
              </div>
            ))}
            {analysis.recommendations.map((rec, index) => (
              <div key={`rec-${index}`} className="rec-item rec-action">
                <CheckCircle size={16} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilWater;
