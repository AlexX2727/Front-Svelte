import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');

if (target) {
  mount(App, { target });
} else {
  console.error('No se encontró el elemento con ID "app"');
}