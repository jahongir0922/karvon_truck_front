import { ref } from 'vue';
export const ads = ref<Array<object>>([]);
export default () => {
  const adSocketUrl: string = process.env.WS_URL + 'ads' || '';
  const adSocket = new WebSocket(adSocketUrl);

  adSocket.onopen = () => {
    console.log('Reklama WebSocket ulandi');
  };

  adSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'initial_ads') {
      ads.value = message.data;
      console.log('Dastlabki reklamalar:', message.data);
    } else if (message.type === 'ad_change') {
      ads.value.unshift(message.data);
      console.log('Reklama yangilandi:', message);
    }
  };
  // Qayta ulanish mexanizmi
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  function setupReconnect(socket: WebSocket, endpoint: string) {
    socket.onclose = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        console.log(`Qayta ulanish urinishi ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
        setTimeout(() => {
          reconnectAttempts++;
          socket = new WebSocket(endpoint);
          setupReconnect(socket, endpoint);
        }, reconnectDelay);
      } else {
        console.log('Qayta ulanish urinishlari tugadi');
      }
    };
  }

  setupReconnect(adSocket, adSocketUrl);
  return {};
};
