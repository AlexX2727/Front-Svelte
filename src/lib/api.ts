import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // conexion al backend netjs
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;