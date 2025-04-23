import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { refreshTokens: true },
    });
    return user ?? undefined;
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }
  async findById(userId: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['refreshTokens'],
    });
    return user ?? undefined;
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    // Assuming bcrypt is used for hashing passwords
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<User | undefined> {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) {
      return undefined;
    }

    // Assuming you have a method to compare passwords
    const isPasswordValid = await this.comparePasswords(
      oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return undefined;
    }

    user.password = newPassword;
    return await this.userRepository.save(user);
  }
}
