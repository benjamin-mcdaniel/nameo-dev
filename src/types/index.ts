export interface DomainStats {
  totalDomains: number
  averageAge: number
  marketIndex: number
  monthlyRegistrations: {
    month: string
    registrations: number
    transfers: number
  }[]
}
