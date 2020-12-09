import { OnEvent } from '../on-event';
import { EventEmitter } from '../senders';
import { filterEvents } from './filter-events';

describe('filterEvents', () => {

  let emitter: EventEmitter<[string]>;
  let mockReceiver: jest.Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventEmitter();
    mockReceiver = jest.fn();
  });

  it('sends matching events', () => {
    emitter.on().do(filterEvents(_str => true)).to(mockReceiver);
    emitter.send('event1');
    emitter.send('event2');

    expect(mockReceiver).toHaveBeenCalledWith('event1');
    expect(mockReceiver).toHaveBeenLastCalledWith('event2');
  });
  it('filters out not matching events', () => {
    emitter.on().do(filterEvents(str => !str.startsWith('-'))).to(mockReceiver);
    emitter.send('-event1');
    emitter.send('event2');

    expect(mockReceiver).not.toHaveBeenCalledWith('event1');
    expect(mockReceiver).toHaveBeenCalledWith('event2');
    expect(mockReceiver).toHaveBeenLastCalledWith('event2');
  });
  it('sends values implementing the given type', () => {

    type TargetType = `+${string}`;

    const filtered: OnEvent<[TargetType]> = emitter.on().do(filterEvents(isOfTargetType));

    filtered.to(mockReceiver);
    emitter.send('+event1');
    emitter.send('-event2');

    expect(mockReceiver).toHaveBeenCalledWith('+event1');
    expect(mockReceiver).not.toHaveBeenCalledWith('-event2');
    expect(mockReceiver).toHaveBeenLastCalledWith('+event1');

    function isOfTargetType(value: string): value is TargetType {
      return value.startsWith('+');
    }
  });
});
