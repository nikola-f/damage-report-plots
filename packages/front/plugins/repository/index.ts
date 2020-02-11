import AgentRepository from './agentRepository';
import JobRepository from './jobRepository';
import SystemRepository from './systemRepository';
import Vue from 'vue';



const repositories = {
  agent: AgentRepository,
  job: JobRepository,
  system: SystemRepository
};

export const RepositoryFactory = {
  get: (name: string) => {
    // @ts-ignore
    return repositories[name];
  }
};


Vue.prototype.$repositoryFactory = RepositoryFactory;
