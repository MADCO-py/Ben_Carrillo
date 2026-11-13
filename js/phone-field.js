import './vendor/libphonenumber-min.js';
import {getLocale} from './locales.js?v=20261113-languages1';

// Local numbering metadata; no lookup service receives the visitor's number.
export function setupPhoneField(form, text) {
  const input = form.querySelector('#phone');
  const country = form.querySelector('#phone-country');
  const phone = globalThis.libphonenumber;
  function countries(language) {
    const selected = country.value || 'GT';
    const locale = getLocale(language).intl;
    const names = new Intl.DisplayNames([locale], {type:'region'});
    const options = phone.getCountries().map(code => ({code, name:names.of(code) || code}));
    options.sort((a,b) => a.name.localeCompare(b.name,locale));
    country.replaceChildren(...options.map(({code,name}) => {
      const option = document.createElement('option');
      option.value = code; option.textContent = `${name} (+${phone.getCountryCallingCode(code)})`;
      option.defaultSelected = code === 'GT';
      return option;
    }));
    country.value = selected;
  }
  function validate(format = false) {
    input.setCustomValidity(''); delete input.dataset.e164;
    if (!input.value.trim()) return true;
    let number;
    try { number = phone.parsePhoneNumber(input.value.trim(), {defaultCountry:country.value,extract:false}); } catch {}
    if (!number || !number.isPossible() || !number.isValid()) {
      input.setCustomValidity(text('phoneInvalid','Check the number and country code.'));
      return false;
    }
    input.dataset.e164 = number.number;
    if (number.country) country.value = number.country;
    if (format) input.value = number.formatInternational();
    return true;
  }
  input.addEventListener('input', () => { input.setCustomValidity(''); delete input.dataset.e164; });
  input.addEventListener('blur', () => validate(true));
  country.addEventListener('change', () => validate());
  form.addEventListener('reset', () => { input.setCustomValidity(''); delete input.dataset.e164; });
  document.addEventListener('ben-language', event => { countries(event.detail.language); validate(); });
  countries(document.documentElement.lang);
  return { validate };
}
