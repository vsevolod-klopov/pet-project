/**
 * Price helpers: comma thousands + ruble display.
 */

function parsePriceDigits(raw) {
  if (raw == null) return '';
  return String(raw).replace(/[^\d]/g, '');
}

function formatPriceInputValue(digits) {
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

function formatPriceDisplay(raw) {
  const digits = parsePriceDigits(raw);
  if (!digits) {
    return String(raw || '').trim();
  }
  return `${Number(digits).toLocaleString('en-US')} ₽`;
}

function initPriceInput(input) {
  if (!input || input.dataset.priceBound === '1') return;
  input.dataset.priceBound = '1';
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('autocomplete', 'off');

  input.addEventListener('input', () => {
    const digits = parsePriceDigits(input.value);
    const caretFromEnd = input.value.length - (input.selectionStart ?? input.value.length);
    input.value = formatPriceInputValue(digits);
    const nextPos = Math.max(0, input.value.length - caretFromEnd);
    input.setSelectionRange(nextPos, nextPos);
  });
}
