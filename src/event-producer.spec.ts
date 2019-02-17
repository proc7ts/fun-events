import { EventProducer } from './event-producer';
import { EventInterest, noEventInterest } from './event-interest';
import { EventSource } from './event-source';
import { passIf } from 'call-thru';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('EventProducer', () => {
  describe('never', () => {

    let producer: EventProducer<[string], number>;
    let consumerSpy: Mock<number, [string]>;
    let interest: EventInterest;

    beforeEach(() => {
      producer = EventProducer.never;
      consumerSpy = jest.fn();
      interest = producer(consumerSpy);
    });

    it('returns no event interest', () => {
      expect(interest).toBeInstanceOf(noEventInterest().constructor);
    });
  });

  describe('[EventSource.on]', () => {
    it('refers itself', () => {

      const producer = EventProducer.of(() => noEventInterest());

      expect(producer[EventSource.on]).toBe(producer);
    });
  });

  describe('once', () => {

    let registerSpy: Mock;
    let producer: EventProducer<[string], string>;
    let interestSpy: Mocked<EventInterest>;
    let registeredConsumer: (event: string) => string;
    let consumerSpy: Mock<string, [string]>;

    beforeEach(() => {
      interestSpy = {
        off: jest.fn()
      };
      registerSpy = jest.fn((c: (event: string) => string) => {
        registeredConsumer = c;
        return interestSpy;
      });
      producer = EventProducer.of(c => registerSpy(c));
      consumerSpy = jest.fn();
    });

    it('registers event consumer', () => {
      expect(producer.once(consumerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalledWith(registeredConsumer);
    });
    it('unregisters notified event consumer', () => {
      consumerSpy.mockReturnValue('result');

      producer.once(consumerSpy);

      expect(interestSpy.off).not.toHaveBeenCalled();

      expect(registeredConsumer('event')).toBe('result');
      expect(consumerSpy).toHaveBeenCalledWith('event');
      expect(interestSpy.off).toHaveBeenCalled();
    });
    it('unregisters immediately notified event consumer', () => {
      consumerSpy.mockReturnValue('result');

      registerSpy = jest.fn((c: (event: string) => string) => {
        registeredConsumer = c;
        c('event');
        return interestSpy;
      });

      producer.once(consumerSpy);

      expect(interestSpy.off).toHaveBeenCalled();
      expect(consumerSpy).toHaveBeenCalledWith('event');
    });
  });

  describe('thru', () => {

    let registerSpy: Mock;
    let interestSpy: Mocked<EventInterest>;
    let registeredConsumer: (event1: string, event2: string) => number;
    let producer: EventProducer<[string, string], number>;
    let consumerSpy: Mock<number>;

    beforeEach(() => {
      interestSpy = {
        off: jest.fn(),
      };
      interestSpy.off.mockName('interest.off()');
      registerSpy = jest.fn((c: (event1: string, event2: string) => number) => {
        registeredConsumer = c;
        return interestSpy;
      });
      producer = EventProducer.of(c => registerSpy(c));
      consumerSpy = jest.fn((event: string) => event.length);
    });

    it('registers event consumer', () => {
      producer.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(consumerSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('unregisters event consumer when interest lost', () => {

      const thru = producer.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      const interest1 = thru(consumerSpy);
      const interest2 = thru(jest.fn());

      interest1.off();
      expect(interestSpy.off).not.toHaveBeenCalled();
      interest2.off();
      expect(interestSpy.off).toHaveBeenCalled();
    });
    it('transforms original event', () => {
      producer.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(consumerSpy);

      registeredConsumer('a', 'bb');

      expect(consumerSpy).toHaveBeenCalledWith(`a, bb`);
    });
    it('skips original event', () => {
      producer.thru(
          passIf((event1: string, event2: string) => event1 < event2),
          (event1: string, event2: string) => `${event1}, ${event2}`,
      )(consumerSpy);

      registeredConsumer('a', 'bb');
      expect(consumerSpy).toHaveBeenCalledWith(`a, bb`);

      consumerSpy.mockClear();
      registeredConsumer('b', 'a');
      expect(consumerSpy).not.toHaveBeenCalled();
    });
    it('respects the last consumer result', () => {

      const thru: EventProducer<[string], number> = producer.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      const consumer1Spy = jest.fn(() => 1);
      const consumer2Spy = jest.fn(() => 2);

      thru(consumer1Spy);

      const interest2 = thru(consumer2Spy);

      expect(registeredConsumer('a', 'bb')).toBe(2);

      interest2.off();
      expect(registeredConsumer('a', 'bb')).toBe(1);
    });
  });
});
