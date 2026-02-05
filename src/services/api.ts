import axios from 'axios';

const API_URL = '/api';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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

class ApiService {
  private token: string | null = null;

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

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });
    
    if (response.data.success) {
      this.setToken(response.data.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    
    return response.data;
  }

  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: this.getHeaders(),
      });
    } finally {
      this.clearToken();
    }
  }

  async getUsers() {
    const response = await axios.get(`${API_URL}/users`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getUser(id: number) {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createUser(userData: any) {
    const response = await axios.post(`${API_URL}/users`, userData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async updateUser(id: number, userData: any) {
    const response = await axios.put(`${API_URL}/users/${id}`, userData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await axios.delete(`${API_URL}/users/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getAssignments() {
    const response = await axios.get(`${API_URL}/assignments`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createAssignment(assignmentData: any) {
    const response = await axios.post(`${API_URL}/assignments`, assignmentData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async updateAssignment(id: number, assignmentData: any) {
    const response = await axios.put(`${API_URL}/assignments/${id}`, assignmentData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteAssignment(id: number) {
    const response = await axios.delete(`${API_URL}/assignments/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getSubmissions() {
    const response = await axios.get(`${API_URL}/submissions`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createSubmission(submissionData: any) {
    const response = await axios.post(`${API_URL}/submissions`, submissionData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteSubmission(id: number) {
    const response = await axios.delete(`${API_URL}/submissions/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getEvaluations() {
    const response = await axios.get(`${API_URL}/evaluations`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async createEvaluation(evaluationData: any) {
    const response = await axios.post(`${API_URL}/evaluations`, evaluationData, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

export const apiService = new ApiService();
