export const locales = [
  {code:'en',name:'English',direction:'ltr',intl:'en'},
  {code:'es',name:'Español',direction:'ltr',intl:'es-GT'},
  {code:'ar',name:'العربية',direction:'rtl',intl:'ar'},
  {code:'cak',name:'Kaqchikel',direction:'ltr',intl:'es-GT',partial:true},
  {code:'pt',name:'Português',direction:'ltr',intl:'pt-BR'},
  {code:'ru',name:'Русский',direction:'ltr',intl:'ru'}
];
export const getLocale = code => locales.find(locale=>locale.code===code)||locales[0];
