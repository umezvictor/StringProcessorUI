import axios, { type AxiosRequestHeaders, type AxiosResponse } from "axios";
import Cookies from "js-cookie";
import { environmentVariable } from "../config";

axios.defaults.headers.post["Content-Type"] = "application/json";

axios.defaults.baseURL = environmentVariable.VITE_API_URL;

//intercept api calls and set authorization headers before they hit the api
axios.interceptors.request.use(
  (config) => {
    var api = new APICore();
    const token = api.getUserToken();
    if (token) {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//intercept responses and get refresh token if token has expired
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    var api = new APICore();
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = api.getLoggedInUser();
        const response = await axios.post(
          `${environmentVariable.VITE_API_URL}/api/user/refresh-token`,
          {
            refreshToken: user.refreshToken,
          }
        );
        api.setLoggedInUser(response.data.value);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.value.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        api.setLoggedInUser(null);
        setAuthorization(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

//intercept errors and return the response object
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return error.response;
  }
);

const ACCESS_TOKEN_KEY = "tokenKey";

//here I'm setting the default authorization
const setAuthorization = (token: string | null) => {
  if (token) axios.defaults.headers.common["Authorization"] = "bearer " + token;
  else delete axios.defaults.headers.common["Authorization"];
};

const getUserFromCookie = () => {
  const user = Cookies.get(ACCESS_TOKEN_KEY);
  return user ? (typeof user == "object" ? user : JSON.parse(user)) : null;
};
class APICore {
  postAsync = <T = any>(url: string, data: any): Promise<AxiosResponse<T>> => {
    return axios.post<T>(url, data);
  };

  isUserAuthenticated = () => {
    const user = this.getLoggedInUser();
    if (!user) {
      return false;
    }
    return true;
  };

  setLoggedInUser = (payload: any) => {
    if (payload) {
      Cookies.set(ACCESS_TOKEN_KEY, JSON.stringify(payload), {
        sameSite: "Lax", // I'll use strict in production
        expires: 7,
      });
    } else {
      Cookies.remove(ACCESS_TOKEN_KEY);
      setAuthorization(null);
    }
  };

  getLoggedInUser = () => {
    return getUserFromCookie();
  };

  getUserToken = () => {
    var user = getUserFromCookie();
    if (user) {
      return user.accessToken;
    }

    return null;
  };
}

let user = getUserFromCookie();
if (user) {
  const { token } = user;
  if (token) {
    setAuthorization(token);
  }
}

export { APICore, setAuthorization };
