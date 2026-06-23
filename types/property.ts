export interface Property {
  propertyId: string;
  propertyName: string;
  createdAt: string;
}

export interface PropertyCreateInput {
  propertyId?: string;
  propertyName?: string;
}
