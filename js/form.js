/* ============================================================
   AVINASH & ASSOCIATES — js/form.js
   Contact form validation and submit handling
   ============================================================ */

'use strict';

(function initForm() {
  const form       = $('#contactForm');
  const submitBtn  = $('#submitBtn');
  const successDiv = $('#formSuccess');
  if (!form) return;

  const fields = {
    'f-name':    { validate: v => v.trim().length >= 2,                         msg: 'Please enter your full name (at least 2 characters).' },
    'f-email':   { validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Please enter a valid email address.' },
    'f-phone':   { validate: v => /^[\+]?[\d\s\-\(\)]{8,15}$/.test(v.trim()),  msg: 'Please enter a valid phone number.' },
    'f-service': { validate: v => v !== '',                                      msg: 'Please select a service.' }
  };

  function showError(fieldId, msg) {
    const input = $('#' + fieldId);
    const err   = $('#err-' + fieldId.replace('f-', ''));
    if (!input || !err) return;
    input.classList.add('error');
    err.textContent = msg;
    err.classList.add('show');
  }

  function clearError(fieldId) {
    const input = $('#' + fieldId);
    const err   = $('#err-' + fieldId.replace('f-', ''));
    if (!input || !err) return;
    input.classList.remove('error');
    err.textContent = '';
    err.classList.remove('show');
  }

  function validateField(fieldId) {
    const def   = fields[fieldId];
    const input = $('#' + fieldId);
    if (!def || !input) return true;
    if (def.validate(input.value)) { clearError(fieldId); return true; }
    showError(fieldId, def.msg);
    return false;
  }

  /* Blur + live validation */
  Object.keys(fields).forEach(id => {
    const input = $('#' + id);
    if (!input) return;
    input.addEventListener('blur', () => validateField(id));
    input.addEventListener('input', () => { if (input.classList.contains('error')) validateField(id); });
  });

  /* Submit */
  form.addEventListener('submit', e => {
    e.preventDefault();

    const allValid = Object.keys(fields).map(validateField).every(Boolean);

    if (!allValid) {
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      const firstErr = form.querySelector('.f-input.error');
      if (firstErr) firstErr.focus();
      return;
    }

    /* Show loading state */
    submitBtn.disabled = true;
    const btnText    = submitBtn.querySelector('.btn-submit-text');
    const btnLoading = submitBtn.querySelector('.btn-submit-loading');
    if (btnText)    btnText.style.display    = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';

    /* Simulate async submission */
    setTimeout(() => {
      form.style.display = 'none';
      if (successDiv) successDiv.style.display = 'block';
    }, 1600);
  });
})();
