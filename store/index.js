import Store from 'electron-store';

const schema = {
  github_token: {
    type: 'string',
    default: ''
  },
  user_preferences: {
    type: 'object',
    default: {
      theme: 'dark'
    }
  }
};

const store = new Store({ schema });

export default store;
