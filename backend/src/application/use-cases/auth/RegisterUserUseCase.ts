import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import {
    EmailAlreadyExistsError,
    InvalidEmailError,
} from '@domain/errors/DomainError';
import { randomUUID } from 'crypto';
import { authenticator } from 'otplib';

export interface RegisterUserInput {
    email: string;
    passwordHash: string;
}

export interface RegisterUserOutput {
    userId: string;
    email: string;
    totpSecret: string;
    qrCodeUrl: string;
}

export class RegisterUserUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            throw new InvalidEmailError(input.email);
        }

        const emailExists = await this.userRepository.existsByEmail(email);
        if (emailExists) {
            throw new EmailAlreadyExistsError(input.email);
        }

        const totpSecret = authenticator.generateSecret();

        const userId = UserId.create(randomUUID());
        const user = User.create(userId, email, input.passwordHash, totpSecret);

        await this.userRepository.save(user);

        const serviceName = 'Void Cloud Drive';
        const qrCodeUrl = authenticator.keyuri(
            email.toString(),
            serviceName,
            totpSecret
        );

        return {
            userId: userId.toString(),
            email: email.toString(),
            totpSecret,
            qrCodeUrl,
        };
    }
}