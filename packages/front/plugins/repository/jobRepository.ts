import Repository from './repository';

export default {

  create(auth: Object) {
    return Repository.post('/api/job', auth);
  },

  list(auth: Object) {
    return Repository.get('/api/jobs', auth);
  },
  
  canCreate(auth: Object) {
    return Repository.get('/api/job', auth);
  },
  
};