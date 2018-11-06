import { EventInterest, EventProducer } from './event-producer';
import { noop } from './noop';
import Spy = jasmine.Spy;
import SpyObj = jasmine.SpyObj;

describe('EventProducer', () => {
  describe('never', () => {

    let producer: EventProducer<(value: string) => number>;
    let consumerSpy: Spy;
    let interest: EventInterest;

    beforeEach(() => {
      producer = EventProducer.never;
      consumerSpy = jasmine.createSpy('consumer');
      interest = producer(consumerSpy);
    });

    it('returns no event interest', () => {
      expect(interest).toBe(EventInterest.none);
    });
  });

  describe('once', () => {

    let registerSpy: Spy;
    let producer: EventProducer<(value: string) => string>;
    let interestSpy: SpyObj<EventInterest>;
    let registeredConsumer: (event: string) => string;
    let consumerSpy: Spy;

    beforeEach(() => {
      interestSpy = jasmine.createSpyObj('interest', ['off']);
      registerSpy = jasmine.createSpy('register').and.callFake((c: (event: string) => string) => {
        registeredConsumer = c;
        return interestSpy;
      });
      producer = EventProducer.of(c => registerSpy(c));
      consumerSpy = jasmine.createSpy('consumer');
    });

    it('registers event consumer', () => {
      expect(producer.once(consumerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('unregisters notified event consumer', () => {
      consumerSpy.and.returnValue('result');

      producer.once(consumerSpy);

      expect(interestSpy.off).not.toHaveBeenCalled();

      expect(registeredConsumer('event')).toBe('result');
      expect(consumerSpy).toHaveBeenCalledWith('event');
      expect(interestSpy.off).toHaveBeenCalled();
    });
    it('unregisters immediately notified event consumer', () => {
      consumerSpy.and.returnValue('result');

      registerSpy = jasmine.createSpy('register').and.callFake((c: (event: string) => string) => {
        registeredConsumer = c;
        c('event');
        return interestSpy;
      });

      producer.once(consumerSpy);

      expect(interestSpy.off).toHaveBeenCalled();
      expect(consumerSpy).toHaveBeenCalledWith('event');
    });
  });
});

describe('EventInterest', () => {
  describe('none', () => {
    it('is no-op', () => {
      expect(EventInterest.none.off).toBe(noop);
    });
  });
});
