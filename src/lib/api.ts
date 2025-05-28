import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-vrsl.onrender.com', // conexion al backend netjs
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;