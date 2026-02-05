import config from './src/lib/config';

console.log('Database URL defined:', !!config.database.url);
console.log('Database URL starts with:', config.database.url ? config.database.url.substring(0, 15) : 'N/A');
console.log('Database Host:', config.database.url ? config.database.url.split('@')[1]?.split(':')[0] : 'N/A');
console.log('SSL Config:', config.database.ssl);
