import { Injectable } from '@nestjs/common';

import { ReportsRepository } from './reports.repository';

const UPCOMING_HEARINGS_DAYS = 30;

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getOverview() {
    return this.reportsRepository.getOverview();
  }

  async getDeadlinesByStatus() {
    return this.reportsRepository.getDeadlinesByStatus();
  }

  async getWitnessesByStatus() {
    return this.reportsRepository.getWitnessesByStatus();
  }

  async getUpcomingHearings(from?: Date, to?: Date) {
    const defaultFrom = new Date();
    const defaultTo = new Date();
    defaultTo.setUTCDate(defaultTo.getUTCDate() + UPCOMING_HEARINGS_DAYS);
    return this.reportsRepository.getUpcomingHearings(
      from ?? defaultFrom,
      to ?? defaultTo,
    );
  }
}
