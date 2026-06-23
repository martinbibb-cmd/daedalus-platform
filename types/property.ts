export interface Property {
  id: string;
  displayName: string;
  uprn: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyCreateInput {
  displayName?: string;
  uprn?: string;
  address?: string;
}

