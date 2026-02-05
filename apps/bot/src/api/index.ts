import { Router } from 'express';
import { userService } from '../services/user.service';
import { checkInService } from '../services/checkin.service';

export const apiRouter = Router();

apiRouter.get('/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

apiRouter.get('/users/:phone', async (req, res) => {
  try {
    const user = await userService.getUser(req.params.phone);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

apiRouter.get('/users/:phone/checkins', async (req, res) => {
  try {
    const checkIns = await checkInService.getUserCheckIns(req.params.phone);
    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch check-ins' });
  }
});

apiRouter.get('/users/:phone/streak', async (req, res) => {
  try {
    const streak = await checkInService.getCheckInStreak(req.params.phone);
    res.json({ success: true, data: { streak } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch streak' });
  }
});

apiRouter.get('/users/:phone/weekly-summary', async (req, res) => {
  try {
    const summary = await checkInService.getWeeklySummary(req.params.phone);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

apiRouter.get('/stats', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    const activeUsers = await userService.getActiveUsers();
    
    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});
