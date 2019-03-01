import { trackValue, ValueTracker } from './value';
import { EventConsumer } from './event-consumer';
import { EventInterest, noEventInterest } from './event-interest';
import { CachedEventProducer } from './cached-event-producer';
import { EventEmitter } from './event-emitter';
import { onEventKey } from './event-source';
import { afterEventKey } from './cached-event-source';
import { noop } from 'call-thru';

describe('CachedEventProducer', () => {
  describe('from cached source', () => {

    let source: ValueTracker<string>;
    let producer: CachedEventProducer<[string]>;
    let consumer: EventConsumer<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      source = trackValue('initial');
      producer = CachedEventProducer.from(source);
      consumer = jest.fn();
      interest = producer(consumer);
    });

    it('produces cached event upon consumer registration', () => {
      expect(consumer).toHaveBeenCalledWith('initial');
    });
    it('has initial event as the last one', () => {
      expect(producer.lastEvent).toEqual(['initial']);
    });
    it('produces events from the given source', () => {

      const event = 'other';

      source.it = event;
      expect(consumer).toHaveBeenCalledWith(event);
      expect(producer.lastEvent).toEqual([event]);
    });
    it('does not produce events once interest lost', () => {
      interest.off();

      source.it = 'other';
      expect(consumer).not.toHaveBeenCalledWith('other');
      expect(producer.lastEvent).toEqual(['initial']);
    });
  });

  describe('from non-cached source', () => {

    let source: EventEmitter<[string]>;
    let producer: CachedEventProducer<[string]>;
    let consumer: EventConsumer<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      source = new EventEmitter();
      producer = CachedEventProducer.from(source, ['initial']);
      consumer = jest.fn();
      interest = producer(consumer);
    });

    it('produces cached event upon consumer registration', () => {
      expect(consumer).toHaveBeenCalledWith('initial');
    });
    it('has initial event as the last one', () => {
      expect(producer.lastEvent).toEqual(['initial']);
    });
    it('produces events from the given source', () => {

      const event = 'other';

      source.notify(event);
      expect(consumer).toHaveBeenCalledWith(event);
      expect(producer.lastEvent).toEqual([event]);
    });
    it('does not produce events once interest lost', () => {
      interest.off();

      source.notify('other');
      expect(consumer).not.toHaveBeenCalledWith('other');
      expect(producer.lastEvent).toEqual(['initial']);
    });
  });

  describe('from non-cached source without initial value', () => {

    let source: EventEmitter<[string]>;
    let producer: CachedEventProducer<[string]>;

    beforeEach(() => {
      source = new EventEmitter();
      producer = CachedEventProducer.from(source);
    });

    it('throws an exception upon consumer registration', () => {
      expect(() => producer(noop)).toThrow('No emitted events');
    });
    it('throws an exception when requesting the last event', () => {
      expect(() => producer.lastEvent).toThrow('No emitted events');
    });
  });

  describe('[onEventKey]', () => {
    it('refers to itself', () => {

      const producer = CachedEventProducer.of(() => noEventInterest());

      expect(producer[onEventKey]).toBe(producer);
    });
  });

  describe('[afterEventKey]', () => {
    it('refers to itself', () => {

      const producer = CachedEventProducer.of(() => noEventInterest());

      expect(producer[afterEventKey]).toBe(producer);
    });
  });
});
