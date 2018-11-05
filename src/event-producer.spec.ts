import { EventInterest, EventProducer } from './event-producer';
import Spy = jasmine.Spy;

describe('common/events/event-producer', () => {
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
        expect(`${EventInterest.none.off}`.replace(/\s/g, '')).toBe('()=>{}');
      });
    });
  });
});
