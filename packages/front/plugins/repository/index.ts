import AgentRepository from './agentRepository';
import JobRepository from './jobRepository';
import Vue from 'vue';



const repositories = {
  agent: AgentRepository,
  job: JobRepository
};

export const RepositoryFactory = {
  get: (name: string) => {
    // @ts-ignore
    return repositories[name];
  }
};


Vue.prototype.$repositoryFactory = RepositoryFactory;
