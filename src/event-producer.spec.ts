import { EventProducer } from './event-producer';
import { EventInterest } from './event-interest';
import { EventSource } from './event-source';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('EventProducer', () => {
  describe('never', () => {

    let producer: EventProducer<[string], number>;
    let consumerSpy: Mock<(event: string) => number>;
    let interest: EventInterest;

    beforeEach(() => {
      producer = EventProducer.never;
      consumerSpy = jest.fn();
      interest = producer(consumerSpy);
    });

    it('returns no event interest', () => {
      expect(interest).toBe(EventInterest.none);
    });
  });

  describe('[EventSource.on]', () => {
    it('refers itself', () => {

      const producer = EventProducer.of(() => EventInterest.none);

      expect(producer[EventSource.on]).toBe(producer);
    });
  });

  describe('once', () => {

    let registerSpy: Mock;
    let producer: EventProducer<[string], string>;
    let interestSpy: Mocked<EventInterest>;
    let registeredConsumer: (event: string) => string;
    let consumerSpy: Mock<(event: string) => string>;

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
        off: jest.fn()
      };
      registerSpy = jest.fn((c: (event1: string, event2: string) => number) => {
        registeredConsumer = c;
        return interestSpy;
      });
      producer = EventProducer.of(c => registerSpy(c));
      consumerSpy = jest.fn((event: string) => event.length);
    });

    it('registers event consumer', () => {
      expect(
          producer.thru(
              (event1: string, event2: string) => `${event1}, ${event2}`
          )(consumerSpy)
      ).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('transforms original event', () => {
      producer.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(consumerSpy);

      registeredConsumer('a', 'bb');

      expect(consumerSpy).toHaveBeenCalledWith(`a, bb`);
    });
  });
});
