import { EventEmitter } from './event-emitter';
import { EventInterest } from './event-producer';
import Spy = jasmine.Spy;

describe('EventEmitter', () => {

  let emitter: EventEmitter<(event: string) => string>;
  let consumerSpy: Spy;
  let consumer2Spy: Spy;

  beforeEach(() => {
    emitter = new EventEmitter();
  });
  beforeEach(() => {
    consumerSpy = jasmine.createSpy('consumer');
    consumer2Spy = jasmine.createSpy('consumer2');
  });

  it('has no consumers initially', () => {
    expect(emitter.consumers).toBe(0);
  });

  describe('on', () => {

    let interest: EventInterest;

    beforeEach(() => {
      interest = emitter.on(consumerSpy);
    });

    it('registers event consumer', () => {
      expect(emitter.consumers).toBe(1);

      emitter.on(consumer2Spy);

      emitter.notify('event');

      expect(consumerSpy).toHaveBeenCalledWith('event');
      expect(consumer2Spy).toHaveBeenCalledWith('event');
    });
    it('unregisters consumer when its interest is lost', () => {
      emitter.on(consumer2Spy);
      interest.off();

      emitter.notify('event');

      expect(consumerSpy).not.toHaveBeenCalled();
      expect(consumer2Spy).toHaveBeenCalledWith('event');
    });
    it('registers event consumer again', () => {

      const interest2 = emitter.on(consumerSpy);

      expect(emitter.consumers).toBe(2);

      emitter.notify('event');

      expect(consumerSpy).toHaveBeenCalledWith('event');
      expect(consumerSpy).toHaveBeenCalledTimes(2);

      consumerSpy.calls.reset();
      interest2.off();

      expect(emitter.consumers).toBe(1);

      emitter.notify('event2');

      expect(consumerSpy).toHaveBeenCalledWith('event2');
      expect(consumerSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('clear', () => {
    it('removes all event consumers', () => {
      emitter.on(consumerSpy);
      emitter.on(consumer2Spy);
      emitter.clear();

      expect(emitter.consumers).toBe(0);

      emitter.notify('event');

      expect(consumerSpy).not.toHaveBeenCalled();
      expect(consumer2Spy).not.toHaveBeenCalled();
    });
  });
});
