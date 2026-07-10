// src/types/index.ts

export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  category?: Category
  type: TransactionType
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
}

export interface TransactionFilter {
  type?: TransactionType | 'all'
  category_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export type Account = {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  opening_balance: number;
  balance: number;
  created_at: string;
};

export type AccountInput = {
  name: string;
  type: string;
  icon?: string;
  color?: string;
  opening_balance?: number;
};

export interface MonthlySummary {
  month: string
  income: number
  expense: number
  balance: number
}

export type AccountWithBalance = {
  id: string
  name: string
  type: string
  icon: string
  color: string
  opening_balance: number
  balance: number
  created_at: string
}

export type GoalWithProgress = {
  id: string
  name: string
  target_amount: number
  progress_amount: number
  progress_percent: number
  deadline: string | null
  icon: string
  color: string
  account_id: string | null
  account_name: string | null
  created_at: string
}
