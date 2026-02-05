interface CheckIn {
  phone: string;
  sleep: number;
  energy: number;
  mood: number;
  willTrain: boolean;
  timestamp: Date;
}

class CheckInService {
  private checkIns: CheckIn[] = [];

  async saveCheckIn(data: Omit<CheckIn, 'timestamp'>): Promise<CheckIn> {
    const checkIn: CheckIn = {
      ...data,
      timestamp: new Date(),
    };

    this.checkIns.push(checkIn);
    return checkIn;
  }

  async getUserCheckIns(phone: string, limit: number = 30): Promise<CheckIn[]> {
    return this.checkIns
      .filter(c => c.phone === phone)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getCheckInStreak(phone: string): Promise<number> {
    const checkIns = await this.getUserCheckIns(phone);
    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkIns.length; i++) {
      const checkInDate = new Date(checkIns[i].timestamp);
      checkInDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkInDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getWeeklySummary(phone: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCheckIns = this.checkIns.filter(
      c => c.phone === phone && c.timestamp >= weekAgo
    );

    if (weekCheckIns.length === 0) {
      return null;
    }

    const avgSleep = weekCheckIns.reduce((sum, c) => sum + c.sleep, 0) / weekCheckIns.length;
    const avgEnergy = weekCheckIns.reduce((sum, c) => sum + c.energy, 0) / weekCheckIns.length;
    const avgMood = weekCheckIns.reduce((sum, c) => sum + c.mood, 0) / weekCheckIns.length;
    const trainingDays = weekCheckIns.filter(c => c.willTrain).length;

    return {
      totalCheckIns: weekCheckIns.length,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgMood: Math.round(avgMood * 10) / 10,
      trainingDays,
    };
  }
}

export const checkInService = new CheckInService();
