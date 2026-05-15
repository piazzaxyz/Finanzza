export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
  description: string;
  is_unnecessary: number;
  family_member_id: number | null;
  family_member_name?: string;
  family_member_relation?: string;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  created_at: string;
}

export interface SummaryTotals {
  total_income: number;
  total_expense: number;
  balance: number;
  unnecessary_total: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  type: string;
}

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
}

export interface MemberSummary {
  id: number;
  name: string;
  relation: string;
  total_expense: number;
  total_income: number;
  count: number;
}

export interface TransactionSummary {
  totals: SummaryTotals;
  byCategory: CategorySummary[];
  byMonth: MonthSummary[];
  byMember: MemberSummary[];
}
