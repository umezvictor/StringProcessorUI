export interface User {
  email: string;
  username: string;
}

export interface UserState {
  value: {
    user: User | null;
    isLoggedIn: boolean;
    error: string | null;
  };
}

export type CancelRequest = {
  jobId: string;
};
