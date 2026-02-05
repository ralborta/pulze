interface User {
  phone: string;
  name: string;
  goal: string;
  restrictions?: string | null;
  createdAt: Date;
  isActive: boolean;
}

class UserService {
  private users: Map<string, User> = new Map();

  async createUser(data: {
    phone: string;
    name: string;
    goal: string;
    restrictions?: string | null;
  }): Promise<User> {
    const user: User = {
      ...data,
      createdAt: new Date(),
      isActive: true,
    };

    this.users.set(data.phone, user);
    return user;
  }

  async getUser(phone: string): Promise<User | undefined> {
    return this.users.get(phone);
  }

  async updateUser(phone: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(phone);
    if (!user) return null;

    const updatedUser = { ...user, ...data };
    this.users.set(phone, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.isActive);
  }
}

export const userService = new UserService();
