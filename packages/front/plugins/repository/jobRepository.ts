import Repository from './repository';

export default {

  create(auth: Object) {
    return Repository.post('/api/job', auth);
  },

  getList(auth: Object) {
    return Repository.get('/api/jobs', auth);
  }
  
};