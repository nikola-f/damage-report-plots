import Repository from './repository';

export default {

  signin(payload: Object) {
    return Repository.post('/api/signin', payload);
  },
  
  signup(payload: Object) {
    return Repository.post('/api/signup', payload);
  }
};