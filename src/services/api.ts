import axios, { AxiosInstance } from 'axios';

const API_URL = '/api';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId?: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    sessionId: string;
    expiresAt: string;
  };
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_by_username: string;
  assigned_to_username: string;
  created_at: string;
}

export interface Submission {
  id: number;
  assignment_id: number;
  submission_notes: string;
  status: string;
  submission_date: string;
  assignment_title: string;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach token to every request
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Auto-redirect on 401
    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await this.client.post('/auth/login', { username, password });
    if (data.success) {
      this.setToken(data.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
    }
    return data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getUsers() {
    const { data } = await this.client.get('/users');
    return data;
  }

  async getUser(id: number) {
    const { data } = await this.client.get(`/users/${id}`);
    return data;
  }

  async createUser(userData: any) {
    const { data } = await this.client.post('/users', userData);
    return data;
  }

  async updateUser(id: number, userData: any) {
    const { data } = await this.client.put(`/users/${id}`, userData);
    return data;
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const { data } = await this.client.patch(`/users/${id}`, { currentPassword, newPassword });
    return data;
  }

  async deleteUser(id: number) {
    const { data } = await this.client.delete(`/users/${id}`);
    return data;
  }

  private buildParams(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.append(k, v);
    }
    const str = sp.toString();
    return str ? `?${str}` : '';
  }

  async getAssignments(sortBy?: string, sortOrder?: string, status?: string) {
    const qs = this.buildParams({ sortBy, sortOrder, status });
    const { data } = await this.client.get(`/assignments${qs}`);
    return data;
  }

  async createAssignment(assignmentData: any) {
    const { data } = await this.client.post('/assignments', assignmentData);
    return data;
  }

  async updateAssignment(id: number, assignmentData: any) {
    const { data } = await this.client.put(`/assignments/${id}`, assignmentData);
    return data;
  }

  async deleteAssignment(id: number) {
    const { data } = await this.client.delete(`/assignments/${id}`);
    return data;
  }

  async getSubmissions(sortBy?: string, sortOrder?: string, status?: string) {
    const qs = this.buildParams({ sortBy, sortOrder, status });
    const { data } = await this.client.get(`/submissions${qs}`);
    return data;
  }

  async createSubmission(submissionData: any) {
    const { data } = await this.client.post('/submissions', submissionData);
    return data;
  }

  async deleteSubmission(id: number) {
    const { data } = await this.client.delete(`/submissions/${id}`);
    return data;
  }

  async getEvaluations(sortBy?: string, sortOrder?: string, rating?: string, status?: string) {
    const qs = this.buildParams({ sortBy, sortOrder, rating, status });
    const { data } = await this.client.get(`/evaluations${qs}`);
    return data;
  }

  async createEvaluation(evaluationData: any) {
    const { data } = await this.client.post('/evaluations', evaluationData);
    return data;
  }

    // ── Notifications ────────────────────────────────────────────────────────────

    async getNotifications(): Promise<{ data: { notifications: AppNotification[]; unreadCount: number } }> {
      const { data } = await this.client.get('/notifications');
      return data;
    }

    async markNotificationRead(id: number) {
      const { data } = await this.client.patch(`/notifications/${id}`);
      return data;
    }

    async markAllNotificationsRead() {
      const { data } = await this.client.post('/notifications');
      return data;
    }

    async deleteNotification(id: number) {
      const { data } = await this.client.delete(`/notifications/${id}`);
      return data;
    }

    // ── Web Push ─────────────────────────────────────────────────────────────────

    async getVapidPublicKey(): Promise<{ publicKey: string }> {
      const { data } = await this.client.get('/push/subscribe');
      return data.data;
    }

    async savePushSubscription(subscription: any) {
      const { data } = await this.client.post('/push/subscribe', subscription);
      return data;
    }

    async removePushSubscription(endpoint: string) {
      const { data } = await this.client.delete('/push/subscribe', { data: { endpoint } });
      return data;
    }
  }

  export const apiService = new ApiService();
