import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
  const isChangeDirect = ref<boolean>(false);
  isChangeDirect.value = (localStorage.getItem('isChangeDirect') || '') == '1' ? true : false;
  function changeDirect(val: string) {
    localStorage.setItem('isChangeDirect', val);
    isChangeDirect.value = val == '1' ? true : false;
  }

  const err = ref({});

  const toastConfig = ref();

  const user: unknown = ref();
  const customToast: unknown = ref({
    visible: false,
    infoText: '',
    infoType: '',
  });

  return {
    isChangeDirect,
    changeDirect,
    err,
    user,
    customToast,
    toastConfig,
  };
});
