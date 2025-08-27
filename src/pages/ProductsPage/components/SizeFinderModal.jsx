// src/pages/ProductsPage/components/SizeFinderModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, User, Weight, Users, Shirt, CheckCircle } from 'lucide-react';
import { recommendSize, validateQuizParams, formatRecommendationForUI, findBestAvailableSizeId } from '../../../utils/sizing';

const SizeFinderModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  sizeChart, 
  currentModel, 
  selectedColorId, 
  getAvailableSizesForColor,
  findVariant 
}) => {
  // Stati del quiz
  const [currentStep, setCurrentStep] = useState(1);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [shoulders, setShoulders] = useState('normali');
  const [build, setBuild] = useState('unisex');
  const [fit, setFit] = useState('regular');
  const [favTeeChestCm, setFavTeeChestCm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Stati UI
  const [errors, setErrors] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  const totalSteps = 4;

  // Load saved data from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem('sizeFinder.v1');
      if (saved) {
        const data = JSON.parse(saved);
        setHeightCm(data.heightCm || 175);
        setWeightKg(data.weightKg || 70);
        setShoulders(data.shoulders || 'normali');
        setBuild(data.build || 'unisex');
        setFit(data.fit || 'regular');
        setFavTeeChestCm(data.favTeeChestCm || '');
      }
    } catch (error) {
      console.warn('Error loading saved quiz data:', error);
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveQuizData = useCallback(() => {
    try {
      const data = {
        heightCm,
        weightKg,
        shoulders,
        build,
        fit,
        favTeeChestCm: favTeeChestCm ? Number(favTeeChestCm) : ''
      };
      localStorage.setItem('sizeFinder.v1', JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving quiz data:', error);
    }
  }, [heightCm, weightKg, shoulders, build, fit, favTeeChestCm]);

  // Generate recommendation when reaching summary
  useEffect(() => {
    if (currentStep === totalSteps + 1) { // Summary step
      const params = {
        heightCm,
        weightKg,
        shoulders,
        fit,
        build,
        favTeeChestCm: favTeeChestCm ? Number(favTeeChestCm) : undefined
      };

      // Validate params
      const validation = validateQuizParams(params);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setCurrentStep(1); // Go back to first step
        return;
      }

      // Generate recommendation
      const reco = recommendSize(params);
      const formatted = formatRecommendationForUI(reco, sizeChart);
      setRecommendation(formatted);

      // Check stock availability
      if (currentModel && selectedColorId) {
        const stockResult = findBestAvailableSizeId(
          currentModel, 
          selectedColorId, 
          reco.size, 
          reco.alt || []
        );
        setStockInfo(stockResult);
      }

      // Save data
      saveQuizData();

      // Clear errors
      setErrors([]);

      // Log telemetry
      console.log('sizeFinder_recommendation', { params, recommendation: reco });
    }
  }, [currentStep, heightCm, weightKg, shoulders, build, fit, favTeeChestCm, sizeChart, currentModel, selectedColorId, saveQuizData]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && currentStep <= totalSteps) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const focusTarget = document.querySelector('.size-finder-modal [data-step-focus="true"]');
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === totalSteps) {
      setCurrentStep(totalSteps + 1); // Go to summary
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleApply = () => {
    if (!recommendation) return;

    // Log telemetry
    console.log('sizeFinder_apply', {
      recommendedSize: recommendation.primarySize,
      confidence: recommendation.confidence,
      method: recommendation.method,
      hasStock: stockInfo?.hasStock
    });

    // Apply the recommendation
    onApply({
      size: stockInfo?.usedLabel || recommendation.primarySize,
      confidence: recommendation.confidence,
      hasStock: stockInfo?.hasStock || false
    });

    onClose();
  };

  const handleClose = () => {
    console.log('sizeFinder_close', { step: currentStep });
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return heightCm >= 140 && heightCm <= 210;
      case 2: return weightKg >= 40 && weightKg <= 130;
      case 3: return shoulders && build;
      case 4: return fit;
      default: return true;
    }
  };

  if (!isOpen) return null;

  const progressPercentage = currentStep <= totalSteps 
    ? (currentStep / totalSteps) * 100 
    : 100;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="size-finder-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="size-finder-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-header">
          <h3 id="size-finder-title">Trova la mia taglia</h3>
          <button 
            className="modal-close" 
            onClick={handleClose}
            aria-label="Chiudi"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="size-finder-progress">
          <div 
            className="size-finder-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Content */}
        <div className="size-finder-content">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="size-finder-errors">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}

          {/* Step 1: Altezza */}
          {currentStep === 1 && (
            <div className="size-finder-step">
              <div className="step-icon">
                <User size={32} />
              </div>
              <h4>Qual è la tua altezza?</h4>
              <div className="input-group">
                <div className="slider-input">
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="range-slider"
                    data-step-focus="true"
                    aria-label="Altezza in centimetri"
                  />
                  <div className="range-labels">
                    <span>140cm</span>
                    <span>210cm</span>
                  </div>
                </div>
                <div className="number-input">
                  <input
                    type="number"
                    min="140"
                    max="210"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 140)}
                    className="size-finder-input"
                    aria-label="Altezza"
                  />
                  <span className="input-unit">cm</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Peso */}
          {currentStep === 2 && (
            <div className="size-finder-step">
              <div className="step-icon">
                <Weight size={32} />
              </div>
              <h4>Qual è il tuo peso?</h4>
              <div className="input-group">
                <div className="slider-input">
                  <input
                    type="range"
                    min="40"
                    max="130"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="range-slider"
                    data-step-focus="true"
                    aria-label="Peso in chilogrammi"
                  />
                  <div className="range-labels">
                    <span>40kg</span>
                    <span>130kg</span>
                  </div>
                </div>
                <div className="number-input">
                  <input
                    type="number"
                    min="40"
                    max="130"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 40)}
                    className="size-finder-input"
                    aria-label="Peso"
                  />
                  <span className="input-unit">kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Corporatura */}
          {currentStep === 3 && (
            <div className="size-finder-step">
              <div className="step-icon">
                <Users size={32} />
              </div>
              <h4>Come descriveresti la tua corporatura?</h4>
              
              {/* Shoulders */}
              <div className="option-group">
                <p className="option-label">Spalle:</p>
                <div className="button-group">
                  {['strette', 'normali', 'larghe'].map(option => (
                    <button
                      key={option}
                      className={`option-button ${shoulders === option ? 'active' : ''}`}
                      onClick={() => setShoulders(option)}
                      data-step-focus={option === 'normali' ? 'true' : 'false'}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Build */}
              <div className="option-group">
                <p className="option-label">Struttura corpo:</p>
                <div className="button-group">
                  {[
                    { value: 'unisex', label: 'Unisex' },
                    { value: 'femminile', label: 'Femminile' }
                  ].map(option => (
                    <button
                      key={option.value}
                      className={`option-button ${build === option.value ? 'active' : ''}`}
                      onClick={() => setBuild(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Fit + Advanced */}
          {currentStep === 4 && (
            <div className="size-finder-step">
              <div className="step-icon">
                <Shirt size={32} />
              </div>
              <h4>Come preferisci che calzi la maglietta?</h4>
              
              {/* Fit preference */}
              <div className="option-group">
                <div className="button-group">
                  {[
                    { value: 'aderente', label: 'Aderente', desc: 'Più attillata' },
                    { value: 'regular', label: 'Regular', desc: 'Vestibilità normale' },
                    { value: 'oversize', label: 'Oversize', desc: 'Più larga' }
                  ].map(option => (
                    <button
                      key={option.value}
                      className={`option-button-large ${fit === option.value ? 'active' : ''}`}
                      onClick={() => setFit(option.value)}
                      data-step-focus={option.value === 'regular' ? 'true' : 'false'}
                    >
                      <span className="option-title">{option.label}</span>
                      <span className="option-desc">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced options (collapsible) */}
              <div className="advanced-section">
                <button 
                  className="advanced-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  aria-expanded={showAdvanced}
                >
                  Opzioni avanzate {showAdvanced ? '▲' : '▼'}
                </button>
                
                {showAdvanced && (
                  <div className="advanced-content">
                    <div className="option-group">
                      <label htmlFor="chest-input" className="option-label">
                        Petto della tua T-shirt preferita (cm):
                      </label>
                      <div className="number-input">
                        <input
                          id="chest-input"
                          type="number"
                          min="35"
                          max="80"
                          value={favTeeChestCm}
                          onChange={(e) => setFavTeeChestCm(e.target.value)}
                          className="size-finder-input"
                          placeholder="es. 51"
                          aria-describedby="chest-help"
                        />
                        <span className="input-unit">cm</span>
                      </div>
                      <p id="chest-help" className="input-help">
                        Misura il petto di una T-shirt che ti calza bene. Questa è la misura più precisa.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {currentStep === totalSteps + 1 && recommendation && (
            <div className="size-finder-step">
              <div className="step-icon success">
                <CheckCircle size={32} />
              </div>
              <h4>La tua taglia consigliata</h4>
              
              {/* Main recommendation */}
              <div className="recommendation-card">
                <div className="recommended-size">
                  <span className="size-label">{recommendation.primarySize}</span>
                  <div className="confidence-badge confidence-{recommendation.confidence.toLowerCase()}">
                    Confidenza: {recommendation.confidence}
                  </div>
                </div>
                
                <p className="recommendation-desc">
                  {recommendation.description}
                </p>

                {/* Measurements */}
                <div className="measurements">
                  <div className="measurement">
                    <span className="measure-label">Petto:</span>
                    <span className="measure-value">{recommendation.measurements.chest} cm</span>
                  </div>
                  <div className="measurement">
                    <span className="measure-label">Lunghezza:</span>
                    <span className="measure-value">{recommendation.measurements.length} cm</span>
                  </div>
                </div>
              </div>

              {/* Alternatives */}
              {recommendation.alternatives.length > 0 && (
                <div className="alternatives-section">
                  <h5>Alternative da considerare:</h5>
                  <div className="alternatives-list">
                    {recommendation.alternatives.map(altSize => (
                      <div key={altSize} className="alternative-size">
                        <span className="alt-label">{altSize}</span>
                        <span className="alt-measurements">
                          {sizeChart[altSize]?.chest || 0}×{sizeChart[altSize]?.length || 0}cm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock warning */}
              {stockInfo && !stockInfo.hasStock && (
                <div className="stock-warning">
                  <p>
                    ⚠️ La taglia {recommendation.primarySize} non è disponibile nel colore selezionato.
                    {stockInfo.usedLabel && stockInfo.usedLabel !== recommendation.primarySize && (
                      <> Ti suggeriamo la taglia {stockInfo.usedLabel} come alternativa.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="size-finder-footer">
          {currentStep <= totalSteps && (
            <>
              {/* Step indicator */}
              <div className="step-indicator">
                <span>Passo {currentStep} di {totalSteps}</span>
              </div>

              {/* Navigation buttons */}
              <div className="nav-buttons">
                {currentStep > 1 && (
                  <button 
                    className="nav-button secondary"
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={20} />
                    Indietro
                  </button>
                )}
                
                <button 
                  className={`nav-button primary ${canProceed() ? '' : 'disabled'}`}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {currentStep === totalSteps ? 'Calcola taglia' : 'Avanti'}
                  {currentStep < totalSteps && <ChevronRight size={20} />}
                </button>
              </div>
            </>
          )}

          {/* Summary footer */}
          {currentStep === totalSteps + 1 && (
            <div className="summary-buttons">
              <button 
                className="nav-button secondary"
                onClick={() => setCurrentStep(1)}
              >
                Ricomincia
              </button>
              
              <button 
                className="nav-button primary"
                onClick={handleApply}
              >
                Applica taglia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SizeFinderModal;