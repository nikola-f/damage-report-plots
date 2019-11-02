import AgentRepository from './agentRepository';
import Vue from 'vue';



const repositories = {
  agent: AgentRepository
};

export const RepositoryFactory = {
  get: (name: string) => {
    // @ts-ignore
    return repositories[name];
  }
};


Vue.prototype.$repositoryFactory = RepositoryFactory;
