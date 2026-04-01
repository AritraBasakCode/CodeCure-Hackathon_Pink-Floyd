import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const predictToxicity = (smiles) =>
  api.post('/predict', { smiles }).then(r => r.data);

export const batchPredict = (smiles_list) =>
  api.post('/batch-predict', { smiles_list }).then(r => r.data);

export const getExampleMolecules = () =>
  api.get('/example-molecules').then(r => r.data);

export const getModelMetrics = () =>
  api.get('/model-metrics').then(r => r.data);

export const getEndpoints = () =>
  api.get('/endpoints').then(r => r.data);

export default api;
