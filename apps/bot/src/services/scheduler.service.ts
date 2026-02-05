import { userService } from './user.service';
import { logger } from '../utils/logger';

class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    this.scheduleDailyCheckIns();
    this.scheduleWeeklySummaries();
    
    logger.info('📅 Scheduler service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('📅 Scheduler service stopped');
  }

  private scheduleDailyCheckIns() {
    setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour === 8) {
        await this.sendDailyCheckInReminders();
      }
    }, 60 * 60 * 1000);
  }

  private scheduleWeeklySummaries() {
    setInterval(async () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      if (day === 0 && hour === 18) {
        await this.sendWeeklySummaries();
      }
    }, 60 * 60 * 1000);
  }

  private async sendDailyCheckInReminders() {
    const users = await userService.getActiveUsers();
    
    logger.info(`Sending daily check-in reminders to ${users.length} users`);

  }

  private async sendWeeklySummaries() {
    const users = await userService.getActiveUsers();
    
    logger.info(`Sending weekly summaries to ${users.length} users`);

  }
}

export const schedulerService = new SchedulerService();
