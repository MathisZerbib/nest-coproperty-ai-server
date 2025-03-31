import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = {
  userId: number;
  email: string;
  username: string;
  password: string;
};

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      email: 'j@j.com',
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      email: 'm@b.com',
      password: 'guess',
    },
  ];
  findOne(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }
  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }
  create(user: User) {
    this.users.push(user);
    return user;
  }
  getAllUsers() {
    return this.users;
  }
  sendVerificationEmail(email: string) {
    // Pseudo-code for sending a verification email
    console.log(`Verification email sent to ${email}`);
  }
}
