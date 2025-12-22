
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  PAID = 'PAID'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export enum PaymentMethod {
  CASH = 'CASH',
  EWALLET = 'EWALLET'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  contact: string;
  avatar?: string; // Base64 or URL
  accountStatus: AccountStatus;
  rejectionReason?: string;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  amount: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string; // ISO string
  endDate?: string; // Optional range
  location: string;
  status: TaskStatus;
  createdBy: string; // Admin ID
  createdAt: string;
  assignedTo?: string; // Employee ID
  isBatch?: boolean;
  subTasks?: SubTask[];
  completionPhoto?: string; // Base64 proof
  completionLocationVerified?: boolean;
  rejectionReason?: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentProfile {
  userId: string;
  defaultMethod: PaymentMethod;
  walletProvider?: string;
  walletIdentifier?: string; // Account Number
  walletHolderName?: string; // Account Name
}

export interface PaymentRequest {
  id: string;
  taskId: string;
  employeeId: string;
  amount: number;
  method: PaymentMethod;
  paymentDetailsSnapshot: string; // JSON or formatted text
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  employeeId: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt?: string;
  receiptImage?: string; // base64
  rejectionReason?: string;
  methodSnapshot: string;
}

export interface AppState {
  currentUser: User | null;
  tasks: Task[];
  requests: PaymentRequest[];
  withdrawals: WithdrawalRequest[];
  profiles: PaymentProfile[];
}
