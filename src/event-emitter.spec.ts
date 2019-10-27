import { EventEmitter } from './event-emitter';
import { OnEvent__symbol } from './event-sender';
import { EventSupply } from './event-supply';
import Mock = jest.Mock;

describe('EventEmitter', () => {

  let emitter: EventEmitter<[string]>;
  let mockReceiver: Mock<void, [string]>;
  let mockReceiver2: Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventEmitter();
  });
  beforeEach(() => {
    mockReceiver = jest.fn();
    mockReceiver2 = jest.fn();
  });

  it('has no receiver initially', () => {
    expect(emitter.size).toBe(0);
  });

  describe('[OnEvent__symbol]', () => {
    it('refers to `on`', () => {
      expect(emitter[OnEvent__symbol]).toBe(emitter.on);
    });
  });

  describe('on', () => {

    let supply: EventSupply;

    beforeEach(() => {
      supply = emitter.on(mockReceiver);
    });

    it('registers event receiver', () => {
      expect(emitter.size).toBe(1);

      emitter.on(mockReceiver2);

      emitter.send('event');

      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver2).toHaveBeenCalledWith('event');
    });
    it('unregisters receiver when its supply is cut off', () => {
      emitter.on(mockReceiver2);
      supply.off();

      emitter.send('event');

      expect(mockReceiver).not.toHaveBeenCalled();
      expect(mockReceiver2).toHaveBeenCalledWith('event');
    });
    it('registers event receiver again', () => {

      const supply2 = emitter.on(mockReceiver);

      expect(emitter.size).toBe(2);

      emitter.send('event');

      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver).toHaveBeenCalledTimes(2);

      mockReceiver.mockClear();
      supply2.off();

      expect(emitter.size).toBe(1);

      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
    });
  });

  describe('recurrent event', () => {

    let records: [string, number][];

    beforeEach(() => {
      records = [];
      emitter.on({
        receive(context, event) {
          records.push([event, 1]);
          emitter.send(event + '!');
          context.onRecurrent(recurrent => {
            records.push([recurrent, 11]);
          });
        }
      });
      emitter.on(mockReceiver2.mockImplementation(event => {
        records.push([event, 2]);
      }));
    });

    it('is handled after original one', () => {
      emitter.send('event');
      expect(records).toEqual([['event', 1], ['event', 2], ['event!', 11], ['event!', 2]]);
    });
  });

  describe('done', () => {
    it('removes all event receivers', () => {
      emitter.on(mockReceiver);
      emitter.on(mockReceiver2);
      emitter.done();

      expect(emitter.size).toBe(0);

      emitter.send('event');

      expect(mockReceiver).not.toHaveBeenCalled();
      expect(mockReceiver2).not.toHaveBeenCalled();
    });
    it('notifies cut off callbacks', () => {

      const reason = 'some reason';
      const whenOff1 = jest.fn();
      const whenOff2 = jest.fn();

      emitter.on(mockReceiver).whenOff(whenOff1);
      emitter.on(mockReceiver2).whenOff(whenOff2);
      emitter.done(reason);

      expect(whenOff1).toHaveBeenCalledWith(reason);
      expect(whenOff2).toHaveBeenCalledWith(reason);
    });
  });
});
