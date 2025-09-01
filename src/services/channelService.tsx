import api from './api';

export const checkUserChannel = async (userId: string) => {
  const response = await api.get(`/users/${userId}/channel`);
  return response.data.exists;
};

export const createChannel = async (userId: string, name: string) => {
  const response = await api.post('/channels', { userId, name });
  return response.data.channelId;
};
