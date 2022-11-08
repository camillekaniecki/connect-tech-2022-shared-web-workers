<template>
  
</template>

<script>
import { mapGetters } from 'vuex';
import { v4 as uuidv4 } from 'uuid';
import TokenRefresh from '@/mixins/TokenRefresh';
import SharedWorkerHelper from '@/workers/sharedWorkerHelper';
import WorkerHelper from '@/workers/workerHelper';

export default {
  name: 'App',
  mixins: [
    TokenRefresh,
  ],
  data() {
    return {
      currentRefreshInterval: 300000, // 5 mins
      uuid: null,
      worker: null, // for token refresh
    };
  },
  computed: {
    ...mapGetters({
      authErrors: 'authErrors',
      currentRefreshToken: 'currentRefreshToken',
      isAuthorized: 'isAuthorized',
    }),
    haveActiveWorker() {
      return !!this.worker;
    },
    isAuthenticationView() {
      const routeName = this.$route.name;
      return routeName === 'Logging You In'
        || routeName === 'Login';
    },
    supportsSharedWorkers() {
      return !!window.SharedWorker;
    },
    supportsWebWorkers() {
      return !!window.Worker;
    },
  },
  created() {
    this.createUuid();
    try {
      this.handleWorkerEnd();
    } catch (e) {
      // do nothing, we have no straggling workers
    }
    this.createWorker();
    if (this.currentRefreshInterval > 0 && !this.isAuthenticationView) {
      this.setupWorkerActions();
      this.handleWorkerStart();
    }
  },
  methods: {
    createUuid() {
      this.uuid = uuidv4();
    },
    createWorker() {
      if (!this.worker) {
        if (this.supportsSharedWorkers) {
          this.worker = new SharedWorkerHelper(this.uuid);
        } else if (this.supportsWebWorkers) {
          this.worker = new WorkerHelper(this.uuid);
        } else {
          console.log('web workers not supported in this browser');
        }
      }
    },
    handleWorkerUpdate(type) {
      switch (type) {
        case 'refreshTokens':
          this.refreshTokens(this.currentRefreshToken);
          if (this.authErrors.length > 0) {
            this.handleWorkerEnd();
            this.$router.push('/loggingyouout');
          }
          break;
        default:
          break;
      }
    },
    async handleWorkerStart() {
      await this.createWorker();
      await this.setupWorkerActions();
      this.worker.on('setInterval', () => {
        this.handleWorkerUpdate('refreshTokens');
      });
    },
    handleWorkerEnd() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },
    async initializeWorkerFromLogin() {
      await this.setupWorkerActions();
      this.handleWorkerStart();
    },
    setupWorkerActions() {
      this.worker.trigger('setInterval', {
        interval: this.currentRefreshInterval,
        type: 'refreshTokens',
        appUuid: this.uuid,
      });
    },
  },
};
