import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosError } from 'axios';
import { Loading } from 'quasar';
import { ref } from 'vue';

export default defineBoot(() => {
  const baseUrl: string = process.env.API_URL || '';
  axios.defaults.baseURL = baseUrl;
  const err = ref({});
  let activeRequests = 0;
  axios.interceptors.request.use(
    (config) => {
      const token = '';
      config.headers.Authorization = token ? token : '';
      if (!config.headers['X-Skip-Loading']) {
        activeRequests++;
        if (activeRequests === 1) {
          loaderOn();
        }
      }
      return config;
    },
    (error) => {
      if (!error.config?.headers['X-Skip-Loading']) {
        activeRequests--;
        if (activeRequests === 0) {
          loaderOff();
        }
      }
      return Promise.reject(new Error(error));
    },
  );
  axios.interceptors.response.use(
    (response) => {
      if (!response.config?.headers['X-Skip-Loading']) {
        activeRequests--;
        if (activeRequests === 0) {
          loaderOff();
        }
      }
      return response;
    },
    (error) => {
      if (!error.config?.headers['X-Skip-Loading']) {
        activeRequests--;
        if (activeRequests === 0) {
          loaderOff();
        }
      }
      const status = error.response ? error.response.status : null;
      if (status === 401) {
        location.href = '/login';
      } else if (status === 422) {
        err.value = error.response.data.errors;
      } else if (status === 403) {
        // router.push('/pages/error403')
      } else if (error.code != 'ERR_NETWORK') {
        errorModal(error);
      }
      return Promise.reject(new Error(error));
    },
  );

  function loaderOn() {
    Loading.show({
      message: 'Yuklanmoqda...',
    });
  }
  function loaderOff() {
    Loading.hide();
  }
  const errorStatusCodes = [
    400,
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    405, // method not allowed
    413, // Request Entity Too Large
    422, // Unprocessable Content
    429, // Throttle
    500, // Server Error
  ];
  function errorModal(err: AxiosError) {
    if (err.code == 'ERR_NETWORK') {
      // showToast('error', '', err.message, 10000)
    } else if (errorStatusCodes.includes(err.status ?? 0)) {
      if (err.status === 401) {
        console.log('Logged out');
      }
    }
  }
});
