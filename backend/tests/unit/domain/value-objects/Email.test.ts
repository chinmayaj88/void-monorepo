import { Email } from '@domain/value-objects/Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.create('invalid@')).toThrow('Invalid email format');
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
      expect(() => Email.create('test@')).toThrow('Invalid email format');
      expect(() => Email.create('test.example.com')).toThrow('Invalid email format');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Invalid email format');
      expect(() => Email.create('   ')).toThrow('Invalid email format');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        '123@example.com',
        'user@sub.example.com',
      ];

      validEmails.forEach((emailStr) => {
        expect(() => Email.create(emailStr)).not.toThrow();
      });
    });
  });

  describe('fromString', () => {
    it('should create email from string', () => {
      const email = Email.fromString('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should behave same as create', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.fromString('test@example.com');
      expect(email1.toString()).toBe(email2.toString());
    });
  });

  describe('equals', () => {
    it('should return true for same emails (case insensitive)', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different whitespace', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('  TEST@EXAMPLE.COM  ');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return normalized email string', () => {
      const email = Email.create('  TEST@EXAMPLE.COM  ');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});

