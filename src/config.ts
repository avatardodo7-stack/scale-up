// Replace with the live Orynto Unit Converter URL.
export const CONVERTER_URL = '[PLACEHOLDER_URL]';

export const converterHref = (): string => (CONVERTER_URL.startsWith('[') ? '#' : CONVERTER_URL);

export const VERSION = '1.0.0';
