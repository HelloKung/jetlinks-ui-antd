import { Reducer } from 'redux';
import { Effect, routerRedux } from 'dva';
import { stringify } from 'querystring';
import router from 'umi/router';

import { setAuthority, clearAutz, setAccessToken, setAutz } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';
import apis from '@/services';
import { reloadAuthorized } from '@/utils/Authorized';

export interface StateType {
  status?: 200 | 400 | undefined;
  type?: string;
  currentAuthority?: 'user' | 'guest' | 'admin';
}

export interface LoginModelType {
  namespace: string;
  state: StateType;
  effects: {
    login: Effect;
    logout: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<StateType>;
  };
}

const Model: LoginModelType = {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload, callback }, { call, put }) {
      const response = yield call(apis.login.login, payload);
      yield put({
        type: 'changeLoginStatus',
        payload: response,
      });
      // Login successfully
      if (response.status === 200) {
        setAccessToken(response.result.token);
        setAutz(response.result);
        reloadAuthorized();
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params as { redirect: string };
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = '/';
            return;
          }
        }
        // yield put(routerRedux.replace(redirect || '/'));
        router.replace(redirect || '/');
        // router.replace('/');
      }
    },

    *logout(_, { call, put }) {
      const response = yield call(apis.login.logout);
      if (response.status === 200) {
        yield put({
          type: 'changeLoginStatus',
          payload: {
            status: response.status,
            result: {
              currentAuthority: 'guest',
            },
          },
        });
        clearAutz();
        reloadAuthorized();
        const { redirect } = getPageQuery();
        // Note: There may be security issues, please note
        if (window.location.pathname !== '/user/login' && !redirect) {
          router.replace({
            pathname: '/user/login',
            search: stringify({
              redirect: window.location.href,
            }),
          });
        }
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};

export default Model;
