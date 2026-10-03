export function normalizeMomoPhone(value:string):string { let phone=value.trim(); if(phone.startsWith('+84'))phone=phone.slice(1); if(/^84[35789]\d{8}$/.test(phone))phone='0'+phone.slice(2);return phone; }
export const isMomoPhone=(value:string)=>/^0[35789]\d{8}$/.test(normalizeMomoPhone(value));
