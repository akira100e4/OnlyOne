// src/pages/CartPage/components/CheckoutDrawer.jsx - VERSIONE COMPLETA
import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, Shield, Truck } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import Drawer from '../../../components/ui/Drawer/Drawer';
import './CheckoutDrawer.css';

const CheckoutDrawer = ({ isOpen, onClose }) => {
  const { items, totals, count } = useCart();
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Italy'
  });
  
  const [paymentData, setPaymentData] = useState({
    method: 'paypal',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardName: ''
  });

  const [errors, setErrors] = useState({});
  const totalSteps = 3;

  // Format price helper
  const formatPrice = (price) => {
    const priceInEuro = price / 100;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceInEuro);
  };

  // Reset form quando si chiude
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateShipping = () => {
    const newErrors = {};
    if (!shippingData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
    if (!shippingData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
    if (!shippingData.email.trim()) {
      newErrors.email = 'Email richiesta';
    } else if (!/\S+@\S+\.\S+/.test(shippingData.email)) {
      newErrors.email = 'Email non valida';
    }
    if (!shippingData.phone.trim()) newErrors.phone = 'Telefono richiesto';
    if (!shippingData.address.trim()) newErrors.address = 'Indirizzo richiesto';
    if (!shippingData.city.trim()) newErrors.city = 'Città richiesta';
    if (!shippingData.postalCode.trim()) newErrors.postalCode = 'CAP richiesto';
    return newErrors;
  };

  const validatePayment = () => {
  const newErrors = {};
  
  console.log('VALIDATING PAYMENT:', paymentData); // Debug
  
  if (paymentData.method === 'card') {
    if (!paymentData.cardNumber || paymentData.cardNumber.trim().length < 13) {
      newErrors.cardNumber = 'Numero carta non valido';
    }
    if (!paymentData.expiryMonth || paymentData.expiryMonth === '') {
      newErrors.expiryMonth = 'Seleziona mese';
    }
    if (!paymentData.expiryYear || paymentData.expiryYear === '') {
      newErrors.expiryYear = 'Seleziona anno';
    }
    if (!paymentData.cvv || paymentData.cvv.trim().length < 3) {
      newErrors.cvv = 'CVV non valido';
    }
    if (!paymentData.cardName || paymentData.cardName.trim().length < 2) {
      newErrors.cardName = 'Nome non valido';
    }
  }
  
  console.log('PAYMENT ERRORS:', newErrors); // Debug
  return newErrors;
};

  // Form handlers
  const handleShippingChange = (field, value) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentData(prev => ({ ...prev, method }));
    setErrors({});
  };

  // Navigation handlers
 const handleNext = useCallback(() => {
  let stepErrors = {};
  
  // Debug per vedere cosa sta succedendo
  console.log('Validation data:', {
    step: currentStep,
    shipping: shippingData,
    payment: paymentData
  });
  
  if (currentStep === 1) {
    stepErrors = validateShipping();
  } else if (currentStep === 2) {
    stepErrors = validatePayment();
  }
  
  console.log('Validation errors:', stepErrors);
  
  if (Object.keys(stepErrors).length > 0) {
    setErrors(stepErrors);
    return;
  }
  
  setErrors({});
  if (currentStep < totalSteps) {
    setCurrentStep(prev => prev + 1);
  }
}, [currentStep, shippingData, paymentData]); // 🔥 AGGIUNGI le dipendenze mancanti: }, [currentStep, shippingData, paymentData]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    if (currentStep !== totalSteps) return;
    
    try {
      setIsSubmitting(true);
      console.log('Submitting order:', { items, shipping: shippingData, payment: paymentData, totals });
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Ordine completato con successo! Riceverai una email di conferma.');
      onClose();
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Errore durante l\'invio dell\'ordine. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="checkout-step">
            <div className="step-header">
              <h3>Dati di spedizione</h3>
              <p>Dove vuoi ricevere il tuo ordine?</p>
            </div>
            
            <div className="checkout-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={shippingData.firstName}
                    onChange={(e) => handleShippingChange('firstName', e.target.value)}
                    placeholder="Mario"
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>
                <div className="form-field">
                  <label>Cognome *</label>
                  <input
                    type="text"
                    value={shippingData.lastName}
                    onChange={(e) => handleShippingChange('lastName', e.target.value)}
                    placeholder="Rossi"
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={shippingData.email}
                    onChange={(e) => handleShippingChange('email', e.target.value)}
                    placeholder="mario.rossi@email.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-field">
                  <label>Telefono *</label>
                  <input
                    type="tel"
                    value={shippingData.phone}
                    onChange={(e) => handleShippingChange('phone', e.target.value)}
                    placeholder="+39 333 123 4567"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </div>
              
              <div className="form-field">
                <label>Indirizzo *</label>
                <input
                  type="text"
                  value={shippingData.address}
                  onChange={(e) => handleShippingChange('address', e.target.value)}
                  placeholder="Via Roma, 123"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label>Città *</label>
                  <input
                    type="text"
                    value={shippingData.city}
                    onChange={(e) => handleShippingChange('city', e.target.value)}
                    placeholder="Milano"
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="form-field form-field--small">
                  <label>CAP *</label>
                  <input
                    type="text"
                    value={shippingData.postalCode}
                    onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                    placeholder="20121"
                    className={errors.postalCode ? 'error' : ''}
                  />
                  {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="checkout-step">
            <div className="step-header">
              <h3>Metodo di pagamento</h3>
              <p>Scegli come vuoi pagare</p>
            </div>
            
            <div className="payment-methods">
              <button
                className={`payment-method ${paymentData.method === 'paypal' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodSelect('paypal')}
              >
                <div className="payment-method__icon">💙</div>
                <div className="payment-method__info">
                  <span className="payment-method__name">PayPal</span>
                  <span className="payment-method__desc">Sicuro e veloce</span>
                </div>
              </button>
              
              <button
                className={`payment-method ${paymentData.method === 'applepay' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodSelect('applepay')}
              >
                <div className="payment-method__icon">🍎</div>
                <div className="payment-method__info">
                  <span className="payment-method__name">Apple Pay</span>
                  <span className="payment-method__desc">Touch ID / Face ID</span>
                </div>
              </button>
              
              <button
                className={`payment-method ${paymentData.method === 'card' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <div className="payment-method__icon">
                  <CreditCard size={20} />
                </div>
                <div className="payment-method__info">
                  <span className="payment-method__name">Carta di Credito</span>
                  <span className="payment-method__desc">Visa, Mastercard, Amex</span>
                </div>
              </button>
            </div>

            {paymentData.method === 'card' && (
              <div className="card-form">
                <div className="form-field">
                  <label>Numero Carta *</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className={errors.cardNumber ? 'error' : ''}
                  />
                  {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-field form-field--small">
                    <label>Mese *</label>
                    <select
                      value={paymentData.expiryMonth}
                      onChange={(e) => handlePaymentChange('expiryMonth', e.target.value)}
                      className={errors.expiryMonth ? 'error' : ''}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    {errors.expiryMonth && <span className="field-error">{errors.expiryMonth}</span>}
                  </div>
                  
                  <div className="form-field form-field--small">
                    <label>Anno *</label>
                    <select
                      value={paymentData.expiryYear}
                      onChange={(e) => handlePaymentChange('expiryYear', e.target.value)}
                      className={errors.expiryYear ? 'error' : ''}
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={String(new Date().getFullYear() + i).slice(-2)}>
                          {String(new Date().getFullYear() + i).slice(-2)}
                        </option>
                      ))}
                    </select>
                    {errors.expiryYear && <span className="field-error">{errors.expiryYear}</span>}
                  </div>
                  
                  <div className="form-field form-field--small">
                    <label>CVV *</label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                      placeholder="123"
                      maxLength="4"
                      className={errors.cvv ? 'error' : ''}
                    />
                    {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Nome Intestatario *</label>
                  <input
                    type="text"
                    value={paymentData.cardName}
                    onChange={(e) => handlePaymentChange('cardName', e.target.value)}
                    placeholder="Mario Rossi"
                    className={errors.cardName ? 'error' : ''}
                  />
                  {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="checkout-step">
            <div className="step-header">
              <h3>Riepilogo ordine</h3>
              <p>Controlla i dettagli prima di confermare</p>
            </div>
            
            <div className="order-summary">
              <div className="summary-section">
                <h4>I tuoi articoli</h4>
                <div className="summary-items">
                  {items.map((item) => (
                    <div key={item.id} className="summary-item">
                      <img 
                        src={item.imageUrl} 
                        alt={item.productTitle}
                        className="summary-item__image"
                      />
                      <div className="summary-item__info">
                        <span className="summary-item__title">{item.productTitle}</span>
                        {item.variantTitle && (
                          <span className="summary-item__variant">{item.variantTitle}</span>
                        )}
                      </div>
                      <span className="summary-item__price">
                        {formatPrice(item.pricePerItem)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-section">
                <h4>Spedizione</h4>
                <div className="summary-shipping">
                  <div className="shipping-info">
                    <Truck size={16} />
                    <span>
                      {shippingData.firstName} {shippingData.lastName}<br/>
                      {shippingData.address}<br/>
                      {shippingData.city}, {shippingData.postalCode}
                    </span>
                  </div>
                  <span className="shipping-cost">Gratuita</span>
                </div>
              </div>

              <div className="summary-section">
                <h4>Pagamento</h4>
                <div className="summary-payment">
                  <Shield size={16} />
                  <span>
                    {paymentData.method === 'paypal' && 'PayPal'}
                    {paymentData.method === 'applepay' && 'Apple Pay'}
                    {paymentData.method === 'card' && `•••• ${paymentData.cardNumber.slice(-4)}`}
                  </span>
                </div>
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotale ({count} {count === 1 ? 'articolo' : 'articoli'})</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>Spedizione</span>
                  <span className="free">Gratuita</span>
                </div>
                <div className="total-row total-row--final">
                  <strong>Totale</strong>
                  <strong>{formatPrice(totals.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      height="75vh"
      title="Checkout"
      description={`Step ${currentStep} di ${totalSteps}`}
      className="checkout-drawer"
      closeOnScrollDown={true}
      closeOnOverlay={false}
    >
      <div className="checkout-drawer-content">
        
        <div className="checkout-progress">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div 
              key={i}
              className={`progress-step ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
            >
              <div className="progress-step__circle">
                {i + 1 < currentStep ? '✓' : i + 1}
              </div>
              <span className="progress-step__label">
                {i === 0 && 'Spedizione'}
                {i === 1 && 'Pagamento'} 
                {i === 2 && 'Conferma'}
              </span>
            </div>
          ))}
        </div>

        <div className="checkout-content">
          {renderStepContent()}
        </div>

        <div className="checkout-footer">
          <div className="checkout-footer__navigation">
            {currentStep > 1 && (
              <button 
                className="checkout-btn checkout-btn--secondary"
                onClick={handlePrev}
                disabled={isSubmitting}
              >
                <ChevronLeft size={20} />
                Indietro
              </button>
            )}
            
            <div className="checkout-footer__spacer"></div>
            
            {currentStep < totalSteps ? (
              <button 
                className="checkout-btn checkout-btn--primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Continua
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                className="checkout-btn checkout-btn--confirm"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Invio in corso...' : 'Conferma Ordine'}
              </button>
            )}
          </div>
          
          <div className="checkout-trust">
            <span>🔒 Pagamento sicuro</span>
            <span>🚚 Spedizione gratuita</span>
            <span>🔄 Soddisfatti o rimborsati</span>
          </div>
        </div>

      </div>
    </Drawer>
  );
};

export default CheckoutDrawer;