import { EventInterest, EventProducer } from './event-producer';
import { noop } from './noop';
import Spy = jasmine.Spy;

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
});
describe('EventInterest', () => {
  describe('none', () => {
    it('is no-op', () => {
      expect(EventInterest.none.off).toBe(noop);
    });
  });
});
