import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Ajusta esto a la URL de tu API NestJS
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;